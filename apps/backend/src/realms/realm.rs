use crate::{
    constants::buckets::S3_DOCS_BUCKET,
    utils::deflate_bytes_gzip::{
        deflate_bytes_gzip,
        CompressionLevel,
    },
};
use hashbrown::HashMap;
use rusoto_s3::{
    PutObjectRequest,
    S3Client,
    S3,
};
use std::{
    ops::Deref,
    sync::Arc,
};
use strum::Display;
use thiserror::Error;
use tokio::{
    sync::Mutex,
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
pub type RealmMap = Arc<Mutex<HashMap<i64, Arc<Realm>>>>;

/// An alias for [RealmMap] type, used to extract the map inside actix services.
pub type RealmData = actix_web::web::Data<Mutex<HashMap<i64, Arc<Realm>>>>;

/// The maximum number of peers that can connect to a single realm.
pub const MAX_PEERS_PER_REALM: u8 = 3;

/// The loop interval duration (in seconds) after which the document gets persisted to the object
/// storage.
const PERSISTENCE_LOOP_DURATION: u64 = 60; // 1 minute

/// The duration (in seconds) for which an empty realm (realm with no connected peers) is kept in
/// the memory. This is to avoid downloading the entire document from the object storage again if
/// the client gets disconnected just for a few seconds. The document is persisted to the object
/// storage just before the realm is destroyed.
const EMPTY_REALM_TIMEOUT: u64 = 45; // 45 seconds

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

/// The error raised while persisting a document using the [Realm::serialize_doc_to_s3] method.
#[derive(Error, Debug)]
pub enum PersistDocError {
    #[error("unable to acquire transaction on the doc")]
    DocTransactionAck,
    #[error("unable to upload the doc to S3: {0}")]
    Upload(String),
    #[error("unable to compress the document: {0}")]
    Compression(String),
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
    pub bc_group: BroadcastGroup,
    /// The number of peers that have currently subscribed to this realm.
    pub peer_count: Mutex<u16>,
    /// The realm map. This is used to drop the realm manager.
    pub realm_map: RealmMap,
    /// The S3 client instance.
    pub s3_client: Arc<S3Client>,
    /// The ID of the document being edited.
    pub doc_id: i64,
    /// The UUID of the document, used as the key for the object storage.
    pub doc_key: String,
    /// The document persistence loop. This is called every [PERSISTENCE_LOOP_DURATION] seconds,
    /// which executes the [Realm::persist_doc_to_s3] method that persists the document to the
    /// object storage over a fixed interval until the realm is destroyed.
    ///
    /// A mutex is used to abort the task when calling the [Realm::destroy] method, as the
    /// [Realm::start_persistence_loop] moves the `Arc<Self>` into the spawned task, which needs to
    /// be aborted so that the realm can be dropped.
    pub persistence_loop_task: Mutex<Option<JoinHandle<()>>>,
    /// The state vector value when the document was last persisted to the object storage. This is
    /// compared against the new state vector to determine whether the document has been updated
    /// since the last persistence call. If the new state vector is exactly equal to the last
    /// state vector, the persistence call is aborted.
    pub last_state_vector: Mutex<StateVector>,
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
        s3_client: Arc<S3Client>,
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
            peer_count: Mutex::new(0),
            persistence_loop_task: Mutex::new(None),
            last_state_vector: Mutex::new(StateVector::default()),
        }
    }

    /// Serializes the present document state to binary data, deflates it using GZIP, and uploads it
    /// to the S3 docs bucket. Returns the size (in bytes) of the document at the time of uploading
    /// it to the object storage.
    pub async fn persist_doc_to_s3(&self) -> Result<usize, PersistDocError> {
        let mut last_state_vec = self.last_state_vector.lock().await;
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
                .deref()
                .put_object(PutObjectRequest {
                    bucket: S3_DOCS_BUCKET.to_string(),
                    key: self.doc_key.to_string(),
                    content_type: Some("application/x-gzip".to_string()),
                    content_encoding: Some("gzip".to_string()),
                    body: Some(compressed_bytes.into()),
                    ..Default::default()
                })
                .await
                .map_err(|error| PersistDocError::Upload(error.to_string()))?;

            // Update the state vector after the compression and uploading process.
            *last_state_vec = next_state_vec;

            Ok(doc_size)
        } else {
            // Document has not been updated since the last persistence call.
            Ok(0)
        }
    }

    /// Removes the realm from the realm map and aborts the document persistence loop task,
    /// eventually dropping the entire realm instance. This will free up the memory occupied by
    /// the document, and clear all the peers.
    pub async fn destroy(&self, reason: RealmDestroyReason) {
        // Broadcast a realm destroy message to the peers with the reason.
        if self.has_peers().await {
            let mut encoder = EncoderV2::new();
            encoder.write_var(MSG_INTERNAL);
            encoder.write_string(&reason.to_string());

            let _ = self.bc_group.broadcast(encoder.to_vec());
        }

        let mut realm_map = self.realm_map.lock().await;
        let persistence_loop_task = self.persistence_loop_task.lock().await;
        realm_map.remove(&self.doc_id);

        if persistence_loop_task.is_some() {
            if let Some(join_handle) = persistence_loop_task.as_ref() {
                join_handle.abort();
            }
        }
    }

    /// Subscribes a new peer to the broadcast group and waits until the connection for the peer is
    /// closed.
    ///
    /// * `sink` - The websocket sink wrapper.
    /// * `stream` - The websocket stream wrapper.
    pub async fn subscribe(self: Arc<Self>, sink: Arc<Mutex<WarpSink>>, stream: WarpStream) {
        let subscription = self.bc_group.subscribe_with(sink, stream, RealmProtocol);

        self.clone().start_persistence_loop().await;
        self.increment_peer_count().await;

        // Wait until the connection ends.
        let _ = subscription.completed().await;

        let mut peer_count = self.peer_count.lock().await;
        *peer_count -= 1;

        if *peer_count == 0 {
            drop(peer_count);

            // Keep the realm in memory for `EMPTY_REALM_TIMEOUT`.
            sleep(Duration::from_secs(EMPTY_REALM_TIMEOUT)).await;

            // If there are still no peers after `EMPTY_REALM_TIMEOUT` seconds, destroy the realm
            if !self.has_peers().await {
                let persist_result = self.persist_doc_to_s3().await;

                // We check for the peers once more, as they might connect when the document was
                // being persisted to the object storage.
                if !self.has_peers().await {
                    match persist_result {
                        Ok(doc_size) => log::info!(
                            "Dropped realm with ID: `{}`. Persisted {doc_size} bytes.",
                            self.doc_id
                        ),
                        Err(error) => log::info!(
                            "Dropped realm with ID: `{}`. Failed to persist the document: {error}",
                            self.doc_id
                        ),
                    };

                    self.destroy(RealmDestroyReason::Internal).await;
                }
            }
        }
    }

    /// Returns `true` if there is at-least one peer subscribed to this realm.
    pub async fn has_peers(&self) -> bool {
        let peer_count = self.peer_count.lock().await;
        *peer_count > 0
    }

    /// Increments the `peer_count` by one.
    async fn increment_peer_count(&self) {
        let mut peer_count = self.peer_count.lock().await;
        *peer_count += 1;
    }

    /// Spawns a child task that starts a document persistence loop, which internally calls the
    /// [Realm::persist_doc_to_s3] method every [PERSISTENCE_LOOP_DURATION] seconds. The task is
    /// aborted when the [Realm] instance is destroyed.
    async fn start_persistence_loop(self: Arc<Self>) {
        let mut persistence_loop_task = self.persistence_loop_task.lock().await;

        if persistence_loop_task.is_none() {
            let mut interval = time::interval(Duration::from_secs(PERSISTENCE_LOOP_DURATION));

            *persistence_loop_task = Some(tokio::spawn({
                let self_ref = Arc::clone(&self);
                async move {
                    loop {
                        interval.tick().await;
                        let _ = self_ref.persist_doc_to_s3().await;
                    }
                }
            }));
        }
    }
}
