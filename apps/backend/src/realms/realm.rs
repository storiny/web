use crate::{
    constants::buckets::S3_DOCS_BUCKET,
    utils::deflate_bytes_gzip::{
        deflate_bytes_gzip,
        CompressionLevel,
    },
    S3Client,
};
use futures::future;
use lockable::{
    AsyncLimit,
    LockableHashMap,
};
use std::sync::Arc;
use strum::Display;
use thiserror::Error;
use tokio::{
    sync::{
        Mutex,
        RwLock,
    },
    task::JoinHandle,
    time::{
        self,
        sleep,
        Duration,
    },
};
use y_sync::{
    awareness::{
        Awareness,
        AwarenessUpdate,
    },
    net::BroadcastGroup,
    sync::{
        Message,
        Protocol,
    },
};
use yrs::{
    encoding::write::Write,
    updates::encoder::{
        Encode,
        Encoder,
        EncoderV2,
    },
    ReadTxn,
    StateVector,
    Transact,
};
use yrs_warp::ws::{
    WarpSink,
    WarpStream,
};

/// The realm map. Key corresponds to the document ID, while values are the respective realm manager
/// instances.
pub type RealmMap = Arc<LockableHashMap<i64, Arc<Realm>>>;

/// An alias for [RealmMap] type, used to extract the map inside actix services.
pub type RealmData = actix_web::web::Data<LockableHashMap<i64, Arc<Realm>>>;

/// The maximum number of peers that can connect to a single realm.
const MAX_PEERS_PER_REALM: u16 = 3;

/// The loop interval duration (in seconds) after which the document gets persisted to the object
/// storage.
// const PERSISTENCE_LOOP_DURATION: u64 = 60; // 1 minute
const PERSISTENCE_LOOP_DURATION: u64 = 5; // 1 minute

/// The duration (in seconds) for which an empty realm (realm with no connected peers) is kept in
/// the memory. This is to avoid downloading the entire document from the object storage again if
/// the client gets disconnected just for a few seconds. The document is persisted to the object
/// storage just before the realm is destroyed.
// const EMPTY_REALM_TIMEOUT: u64 = 30; // 30 seconds
const EMPTY_REALM_TIMEOUT: u64 = 8; // 30 seconds

/// The duration (in seconds) to wait before calling the [Realm::start_timeout_task] method after
/// the last peer unsubscribes. This avoids spawning a task immediately after the last peer
/// disconnects, which can happen, for example, when a peer refreshes its browser window.
const EMPTY_REALM_BURST_TIMEOUT: u64 = 5; // 5 seconds

/// The maximum size (in bytes) of the binary document data after compression.
const MAX_DOCUMENT_SIZE: u32 = 80_00_000; // 8 megabytes

/// The maximum size (in bytes) of the individual incoming awareness update. Awareness updates
/// should normally never overflow this limit unless the peer is sending malformed updates, in
/// which case we simply reject them.
const MAX_AWARENESS_PAYLOAD_SIZE: usize = 10_00_000; // 1 megabyte

/// Tag id for an internal message.
const MSG_INTERNAL: u8 = 4;

/// The reason for destroying a [Realm] instance.
#[derive(Display, Debug)]
pub enum RealmDestroyReason {
    /// The story was published while the realm was active.
    #[strum(serialize = "destroy:story_published")]
    StoryPublished,
    /// The story was deleted while the realm was active.
    #[strum(serialize = "destroy:story_deleted")]
    StoryDeleted,
    /// Other reason
    #[strum(serialize = "destroy:internal")]
    Internal,
}

/// The error raised while persisting a document using the [Realm::persist_doc_to_s3] method.
#[derive(Error, Debug)]
pub enum PersistDocError {
    #[error("unable to acquire transaction on the doc")]
    DocTransactionAck,
    #[error("unable to upload the doc to S3: {0}")]
    Upload(String),
    #[error("unable to compress the document: {0}")]
    Compression(String),
}

/// The reason for calling the [Realm::persist_doc_to_s3] method.
#[derive(Debug)]
enum PersistReason {
    /// The persist method is called just before the realm is about to get dropped.
    Drop,
    /// The persist method has been called from the persistence loop.
    PersistenceLoop,
}

/// The realm sync protocol.
struct RealmProtocol;

impl Protocol for RealmProtocol {
    /// Reply to awareness query or just incoming [AwarenessUpdate], where the current `awareness`
    /// instance is being updated with incoming data.
    fn handle_awareness_update(
        &self,
        awareness: &mut Awareness,
        update: AwarenessUpdate,
    ) -> Result<Option<Message>, y_sync::sync::Error> {
        if update.encode_v2().len() < MAX_AWARENESS_PAYLOAD_SIZE {
            awareness.apply_update(update)?;
        }

        Ok(None)
    }
}

/// The realm manager. It handles the broadcasting of messages, peer subscriptions, and document
/// persistence to the object storage.
pub struct Realm {
    /// The broadcast group. This everything related to the document, such as awareness data and
    /// clients.
    bc_group: BroadcastGroup,
    /// The number of peers that have currently subscribed to this realm.
    peer_count: RwLock<u16>,
    /// The realm map. This is used to drop the realm manager.
    realm_map: RealmMap,
    /// The S3 client instance.
    s3_client: S3Client,
    /// The ID of the document being edited.
    pub doc_id: i64,
    /// The UUID of the document, used as the key for the object storage.
    pub doc_key: String,
    /// The realm timeout loop. This is called when there are no peers subscribed to this realm. It
    /// waits for [EMPTY_REALM_TIMEOUT] seconds for peers before destroying the realm manager.
    timeout_task: RwLock<Option<JoinHandle<()>>>,
    /// The document persistence loop. This is called every [PERSISTENCE_LOOP_DURATION] seconds,
    /// which executes the [Realm::persist_doc_to_s3] method that persists the document to the
    /// object storage over a fixed interval until the realm is destroyed.
    ///
    /// A mutex is used to abort the task when calling the [Realm::destroy] method, as the
    /// [Realm::start_persistence_loop] moves the `Arc<Self>` into the spawned task, which needs to
    /// be aborted so that the realm can be dropped.
    persistence_loop_task: RwLock<Option<JoinHandle<()>>>,
    /// The state vector value when the document was last persisted to the object storage. This is
    /// compared against the new state vector to determine whether the document has been updated
    /// since the last persistence call. If the new state vector is exactly equal to the last
    /// state vector, the persistence call is aborted.
    last_state_vector: RwLock<StateVector>,
}

impl Realm {
    /// Creates a new realm.
    ///
    /// * `realm_map` - The realm map.
    /// * `s3_client` - The S3 client instance.
    /// * `doc_id` - The ID of the document.
    /// * `doc_key` - The UUID of the document, used as the key for the object storage.
    /// * `bc_group` - The broadcast group instance.
    pub fn new(
        realm_map: RealmMap,
        s3_client: S3Client,
        doc_id: i64,
        doc_key: String,
        bc_group: BroadcastGroup,
    ) -> Self {
        Self {
            bc_group,
            doc_id,
            doc_key,
            realm_map,
            s3_client,
            peer_count: RwLock::new(0),
            timeout_task: RwLock::new(None),
            persistence_loop_task: RwLock::new(None),
            last_state_vector: RwLock::new(StateVector::default()),
        }
    }

    /// Determines whether new peers can join this realm. The peer count is capped by
    /// [MAX_PEERS_PER_REALM].
    pub async fn can_join(&self) -> bool {
        let peer_count = self.peer_count.read().await;
        *peer_count < MAX_PEERS_PER_REALM
    }

    /// Returns `true` if there is at-least one peer subscribed to this realm.
    pub async fn has_peers(&self) -> bool {
        let peer_count = self.peer_count.read().await;
        *peer_count > 0
    }

    /// Serializes the present document state to binary data, deflates it using GZIP, and uploads it
    /// to the S3 docs bucket. Returns the size (in bytes) of the document at the time of uploading
    /// it to the object storage.
    pub async fn persist_doc_to_s3(&self) -> Result<usize, PersistDocError> {
        let mut last_state_vec = self.last_state_vector.write().await;
        let awareness = self.bc_group.awareness().read().await;
        let doc = awareness.doc();

        let next_state_vec = {
            let txn = doc
                .try_transact()
                .map_err(|_| PersistDocError::DocTransactionAck)?;

            txn.state_vector()
        };

        // Document has been updated since the last persistence call.
        if *last_state_vec != next_state_vec {
            log::info!("[{}] Persisting the doc…", self.doc_id);

            let doc_binary_data = {
                let txn = doc
                    .try_transact()
                    .map_err(|_| PersistDocError::DocTransactionAck)?;

                txn.encode_state_as_update_v2(&StateVector::default())
            };

            let mut compressed_bytes = deflate_bytes_gzip(&doc_binary_data, None)
                .await
                .map_err(|err| PersistDocError::Compression(err.to_string()))?;

            let mut doc_size = compressed_bytes.len();

            // If the document is too large, try compressing it with the highest compression level.
            if doc_size as u32 > MAX_DOCUMENT_SIZE {
                compressed_bytes =
                    deflate_bytes_gzip(&doc_binary_data, Some(CompressionLevel::Best))
                        .await
                        .map_err(|err| PersistDocError::Compression(err.to_string()))?;
                doc_size = compressed_bytes.len();

                // If the document is still too large, we just reject persisting it to the object
                // storage. This should be a very rare case unless the peers are sending malformed
                // updates. We also update the last state vector here to avoid compressing the data
                // again if there were not updates.
                if doc_size as u32 > MAX_DOCUMENT_SIZE {
                    *last_state_vec = next_state_vec;

                    return Ok(0);
                }
            }

            self.s3_client
                .put_object()
                .bucket(S3_DOCS_BUCKET)
                .key(&self.doc_key)
                .content_type("application/gzip")
                .content_encoding("gzip")
                .body(compressed_bytes.into())
                .send()
                .await
                .map_err(|error| error.into_service_error())
                .map_err(|error| PersistDocError::Upload(error.to_string()))?;

            // Update the state vector after the compression and uploading process.
            *last_state_vec = next_state_vec;

            log::info!("[{}] Persisted {doc_size} bytes", self.doc_id);

            Ok(doc_size)
        } else {
            // Document has not been updated since the last persistence call.
            Ok(0)
        }
    }

    /// Aborts all the inner task that have referenced this realm usign an Arc and broadcasts the
    /// destroy reason to all the subscribed peers.
    ///
    /// It is the responsibility of the caller to remove this realm manually from the [RealmMap] in
    /// order to completely remove it from memory. Attempting to remove this realm from the
    /// realm map within this method would have caused a deadlock, as the realm map would need
    /// to be locked within this method, while the caller would have already locked the
    /// [RealmMap] before calling this method:
    ///
    /// ```rust,no-run
    /// let mut realm = realm_map.async_lock(doc_id, AsyncLimit::no_limit()).await?;
    ///
    /// // This will cause a deadlock here, as the realm map has already been locked in the previous
    /// // line, so we cannot lock it again inside the destroy method.
    /// realm.destroy(reason).await;
    /// ```
    pub async fn destroy(&self, reason: RealmDestroyReason) {
        // Broadcast a realm destroy message to the peers with the reason.
        if self.has_peers().await {
            let mut encoder = EncoderV2::new();
            encoder.write_var(MSG_INTERNAL);
            encoder.write_string(&reason.to_string());

            let _ = self.bc_group.broadcast(encoder.to_vec());
        }

        // Abort tasks that reference this realm using an Arc.

        {
            let mut persistence_loop_task = self.persistence_loop_task.write().await;

            if persistence_loop_task.is_some() {
                if let Some(join_handle) = persistence_loop_task.as_ref() {
                    join_handle.abort();
                    *persistence_loop_task = None;
                }
            }
        }

        {
            let mut timeout_task = self.timeout_task.write().await;

            if timeout_task.is_some() {
                if let Some(join_handle) = timeout_task.as_ref() {
                    join_handle.abort();
                    *timeout_task = None;
                }
            }
        }

        // Persist any updates before destroying
        let _ = self.persist_doc_to_s3().await;
    }

    /// Removes the realm from the realm map and aborts the document persistence loop task,
    /// eventually dropping the entire realm instance. This will free up the memory occupied by
    /// the document, and clear all the peers.
    async fn destroy_and_remove_from_map(&self, reason: RealmDestroyReason) {
        // Lock the document entry until the realm is destroyed.
        if let Ok(mut entry) = self
            .realm_map
            .async_lock(self.doc_id.clone(), AsyncLimit::no_limit())
            .await
        // This should never throw
        {
            let rel = entry.value().unwrap().clone();
            drop(entry);
            let wk = Arc::downgrade(&rel);
            log::info!("before:: {}", wk.strong_count());
            self.destroy(reason).await;
            // entry.remove();
            log::info!("after:: {:#?}", wk.strong_count());
        }
    }

    /// Returns `true` if the timeout task is running.
    async fn is_timeout_task_running(&self) -> bool {
        let timeout_task = self.timeout_task.read().await;
        timeout_task.is_some()
    }

    /// Subscribes a new peer to the broadcast group and waits until the connection for the peer is
    /// closed.
    ///
    /// * `sink` - The websocket sink wrapper.
    /// * `stream` - The websocket stream wrapper.
    pub async fn subscribe(self: Arc<Self>, sink: Arc<Mutex<WarpSink>>, stream: WarpStream) {
        if !self.can_join().await {
            return;
        }

        let subscription = self.bc_group.subscribe_with(sink, stream, RealmProtocol);

        self.increment_peer_count().await;
        future::join(
            self.abort_timeout_task(),
            self.clone().start_persistence_loop(),
        )
        .await;

        // Wait until the connection ends.
        let _ = subscription.completed().await;

        let mut peer_count = self.peer_count.write().await;

        if *peer_count > 0 {
            *peer_count -= 1;
        }

        if *peer_count == 0 {
            drop(peer_count);

            log::info!("[{}] Last peer unsubscribed", self.doc_id);

            // Start the timeout task after the last peer disconnects.
            sleep(Duration::from_secs(EMPTY_REALM_BURST_TIMEOUT)).await;

            self.clone().start_timeout_task().await;
        }
    }

    /// Increments the `peer_count` by one.
    async fn increment_peer_count(&self) {
        let mut peer_count = self.peer_count.write().await;
        *peer_count += 1;
    }

    /// Spawns a child task that starts a document persistence loop, which internally calls the
    /// [Realm::persist_doc_to_s3] method every [PERSISTENCE_LOOP_DURATION] seconds. The task is
    /// aborted when the [Realm] instance is destroyed.
    async fn start_persistence_loop(self: Arc<Self>) {
        let mut persistence_loop_task = self.persistence_loop_task.write().await;

        if persistence_loop_task.is_none() {
            let mut interval = time::interval(Duration::from_secs(PERSISTENCE_LOOP_DURATION));

            *persistence_loop_task = Some(tokio::spawn({
                let self_ref = Arc::clone(&self);
                async move {
                    loop {
                        interval.tick().await;

                        log::info!(".. ^^");

                        // Only persist if there is at-least one peer. The timeout task handles
                        // persisting the document when there are no peers.
                        if self_ref.has_peers().await && !self_ref.is_timeout_task_running().await {
                            let _ = self_ref.persist_doc_to_s3().await;
                        }
                    }
                }
            }));
        }
    }

    /// Spawns a child task that waits for [EMPTY_REALM_TIMEOUT] seconds for new peers. If there are
    /// no new peers during the timeout, the current document state gets persisted to the object
    /// storage and realm manager is destroyed.
    async fn start_timeout_task(self: Arc<Self>) {
        let mut timeout_task = self.timeout_task.write().await;

        if timeout_task.is_none() && !self.has_peers().await {
            log::info!("[{}] Spawned timeout task", self.doc_id);

            *timeout_task = Some(tokio::spawn({
                let self_ref = Arc::clone(&self);
                async move {
                    // Keep the realm in memory for `EMPTY_REALM_TIMEOUT`.
                    sleep(Duration::from_secs(EMPTY_REALM_TIMEOUT)).await;

                    // If there are still no peers after `EMPTY_REALM_TIMEOUT` seconds, destroy the
                    // realm.
                    if !self_ref.has_peers().await {
                        self_ref
                            .destroy_and_remove_from_map(RealmDestroyReason::Internal)
                            .await;
                    }
                }
            }));
        }
    }

    /// Aborts the timeout task if it is running. The is called when a new peer connects while the
    /// timeout task is running.
    async fn abort_timeout_task(&self) {
        let mut timeout_task = self.timeout_task.write().await;

        if timeout_task.is_some() {
            if let Some(join_handle) = timeout_task.as_ref() {
                join_handle.abort();
                log::info!("[{}] Aborted timeout task", self.doc_id);

                *timeout_task = None;
            }
        }
    }
}

impl Drop for Realm {
    fn drop(&mut self) {
        log::info!("[{}] Dropped", self.doc_id);
    }
}
