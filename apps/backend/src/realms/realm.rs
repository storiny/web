use super::{
    broadcast::BroadcastGroup,
    connection::{
        RealmSink,
        RealmStream,
    },
};
use crate::{
    constants::buckets::S3_DOCS_BUCKET,
    utils::deflate_bytes_gzip::{
        deflate_bytes_gzip,
        CompressionLevel,
    },
    S3Client,
};
use hashbrown::HashMap;
use lockable::{
    AsyncLimit,
    LockableHashMap,
};
use std::{
    fmt,
    fmt::Formatter,
    sync::Arc,
};
use strum::Display;
use strum_macros::EnumString;
use thiserror::Error;
use time::OffsetDateTime;
use tokio::{
    sync::{
        Mutex,
        RwLock,
    },
    task::JoinHandle,
    time::{
        interval,
        timeout,
        Duration,
    },
};
use tracing::{
    debug,
    error,
    trace,
    warn,
};
use uuid::Uuid;
use yrs::{
    ReadTxn,
    StateVector,
    Transact,
};

/// The realm map. Key corresponds to the document ID, while values are the respective realm manager
/// instances.
pub type RealmMap = Arc<LockableHashMap<i64, Arc<Realm>>>;

/// An alias for [RealmMap] type, used to extract the map inside actix services.
pub type RealmData = actix_web::web::Data<LockableHashMap<i64, Arc<Realm>>>;

/// The maximum number of peers that can connect to a single realm.
pub const MAX_PEERS_PER_REALM: u16 = 5;

/// The loop interval duration (in seconds) after which the document gets persisted to the object
/// storage.
const PERSISTENCE_LOOP_DURATION: u64 = 60; // 1 minute

/// The maximum size (in bytes) of the binary document data after compression.
const MAX_DOCUMENT_SIZE: u32 = 8_000_000; // 8 megabytes

/// The timeout (in seconds) for uploading a document to the object storage.
const DOC_UPLOAD_TIMEOUT: u64 = 25; // 25 seconds

/// The maximum duration (in seconds) after which the realm will get destroyed and the peers would
/// need to subscribe again. This can happen when the peer leaves the connection open for an
/// absurdly large duration of time.
const REALM_LIFETIME: i64 = 28_800; // 8 hours

/// The reason for destroying a [Realm] instance.
#[derive(Display, Debug, PartialEq)]
pub enum RealmDestroyReason {
    /// The story was published while the realm was active.
    #[strum(serialize = "destroy:story_published")]
    StoryPublished,
    /// The story was unpublished while the realm was active.
    #[strum(serialize = "destroy:story_unpublished")]
    StoryUnpublished,
    /// The story was deleted while the realm was active.
    #[strum(serialize = "destroy:story_deleted")]
    StoryDeleted,
    /// The document size exceeded the [MAX_DOCUMENT_SIZE] limit.
    #[strum(serialize = "destroy:doc_overload")]
    DocOverload,
    /// The [REALM_LIFETIME] was exceeded.
    #[strum(serialize = "destroy:lifetime_exceeded")]
    LifetimeExceeded,
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

/// The error raised while trying to subscribe to a realm using the [Realm::subscribe] method.
#[derive(Debug)]
pub enum SubscribeError {
    /// The realm cannot accept more peers. This is governed by the [MAX_PEERS_PER_REALM] value.
    RealmFull,
}

impl fmt::Display for SubscribeError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

/// The role for the peer.
#[derive(Debug, Copy, Clone, Display, PartialEq, EnumString)]
pub enum PeerRole {
    #[strum(serialize = "viewer")]
    Viewer,
    #[strum(serialize = "editor")]
    Editor,
}

/// The peer instance.
#[derive(Debug)]
struct Peer {
    /// The user ID of the peer.
    id: i64,
    /// The role of the peer.
    role: PeerRole,
    /// The abortable subscription task for the peer.
    subscription: JoinHandle<()>,
}

/// The realm manager. It handles the broadcasting of messages, peer subscriptions, and document
/// persistence to the object storage.
pub struct Realm {
    /// The ID of the document being edited.
    pub doc_id: i64,
    /// The UUID of the document, used as the key for the object storage.
    pub doc_key: String,
    /// The broadcast group. This everything related to the document, such as awareness data and
    /// clients.
    bc_group: BroadcastGroup,
    /// The realm map. This is used to drop the realm manager.
    realm_map: RealmMap,
    /// The map with key as the UUID of the peer and value as the peer instance.
    ///
    /// Peer UUID is used as the key instead of user ID of the peer as the same user can edit the
    /// same document from multiple devices.
    ///
    /// This map is used when destroying a realm to unsubscribe all the peers by aborting their
    /// individual subscription tasks. This can also be used to force unsubscribe a specific peer
    /// by aborting their subscription task.
    peer_map: RwLock<HashMap<Uuid, Peer>>,
    /// The S3 client instance.
    s3_client: S3Client,
    /// The document persistence loop. This is called every [PERSISTENCE_LOOP_DURATION] seconds,
    /// which executes the [Realm::persist_doc_to_s3] method that persists the document to the
    /// object storage over a fixed interval until the realm is destroyed.
    ///
    /// A mutex is used to abort the task when calling the [Realm::destroy] method, as the
    /// [Realm::start_persistence_loop] moves the `Arc<Self>` into the spawned task, which needs to
    /// be aborted so that the realm can be dropped.
    persistence_loop_task: RwLock<Option<JoinHandle<()>>>,
    /// The boolean flag indicating whether this is the last persistence loop iteration. When the
    /// persistence loop detects an empty realm (no subscribed peers), this field is set to `true`,
    /// and the realm is dropped from the memory on the next cycle if there are still no peers.
    is_last_persistence_iteration: RwLock<bool>,
    /// The boolean flag indicating whether the realm is in process of being destroyed. The destroy
    /// process can take some moments due to waiting for a write lock on the realm map or
    /// persisting the document to the object storage.
    is_being_destroyed: RwLock<bool>,
    /// The state vector value when the document was last persisted to the object storage. This is
    /// compared against the new state vector to determine whether the document has been updated
    /// since the last persistence call. If the new state vector is exactly equal to the last
    /// state vector, the persistence call is aborted.
    last_state_vector: RwLock<StateVector>,
    /// The unix timestamp of the instant this realm was created.
    pub created_at: i64,
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
            peer_map: RwLock::new(HashMap::new()),
            persistence_loop_task: RwLock::new(None),
            last_state_vector: RwLock::new(StateVector::default()),
            is_last_persistence_iteration: RwLock::new(false),
            is_being_destroyed: RwLock::new(false),
            created_at: OffsetDateTime::now_utc().unix_timestamp(),
        }
    }

    /// Determines whether new peers can join this realm. The peer count is capped by
    /// [MAX_PEERS_PER_REALM].
    pub async fn can_join(&self) -> bool {
        let peer_map = self.peer_map.read().await;
        (peer_map.len() as u16) < MAX_PEERS_PER_REALM
    }

    /// Returns `true` if there is at-least one peer subscribed to this realm.
    pub async fn has_peers(&self) -> bool {
        let peer_map = self.peer_map.read().await;
        peer_map.len() > 0
    }

    /// Returns the role of the peer using the user ID if present.
    ///
    /// * `user_id` - The user ID of the peer.
    pub async fn get_peer_role(&self, user_id: i64) -> Option<PeerRole> {
        let peer_map = self.peer_map.read().await;
        let (_, peer) = peer_map.iter().find(|&(_, peer)| peer.id == user_id)?;
        Some(peer.role)
    }

    /// Updates the role for an existing peer.
    ///
    /// * `user_id` - The user ID of the peer.
    /// * `next_role` - The next role value for the peer.
    pub async fn update_peer_role(&self, user_id: i64, next_role: PeerRole) {
        // Broadcast a role update message to the peers.
        self.broadcast_internal_message(format!("role_update:{user_id}:{next_role}").as_ref())
            .await;

        // The peer needs to reload the document on role mutation.
        self.remove_peer(user_id, true).await;
    }

    /// Removes a peer from the realm.
    ///
    /// * `user_id` - The user ID of the peer.
    /// * `skip_broadcast` - If `true`, does not broadcasts a peer remove message.
    pub async fn remove_peer(&self, user_id: i64, skip_broadcast: bool) {
        {
            let mut peer_map = self.peer_map.write().await;
            let mut peers_to_remove = Vec::new();

            for (key, peer) in peer_map.iter() {
                if peer.id == user_id {
                    peer.subscription.abort();
                    peers_to_remove.push(*key);
                }
            }

            for peer_id in peers_to_remove {
                peer_map.remove(&peer_id);
            }
        }

        if !skip_broadcast {
            // Broadcast a peer remove message to the peers.
            self.broadcast_internal_message(format!("peer_remove:{user_id}").as_ref())
                .await;
        }
    }

    /// Subscribes a new peer to the broadcast group and waits until the connection for the peer is
    /// closed.
    ///
    /// * `peer_id` - The UUID of the peer.
    /// * `user_id` - The user ID of the peer.
    /// * `role` - The role of the peer.
    /// * `sink` - The websocket sink wrapper.
    /// * `stream` - The websocket stream wrapper.
    #[tracing::instrument(
        name = "REALM subscribe",
        skip_all,
        fields(
            doc_id = self.doc_id,
            doc_key = self.doc_key,
            peer_id,
            user_id,
            role
        ),
        err
    )]
    pub async fn subscribe(
        self: Arc<Self>,
        peer_id: Uuid,
        user_id: i64,
        role: PeerRole,
        sink: Arc<Mutex<RealmSink>>,
        stream: RealmStream,
    ) -> Result<(), SubscribeError> {
        let read_only = role != PeerRole::Editor;

        debug!(
            "[{}] peer join request with ID: {peer_id}, user_id: {user_id}, and read_only: {read_only}",
            self.doc_id
        );

        if !self.can_join().await {
            return Err(SubscribeError::RealmFull);
        }

        debug!(
            "[{}] peer joined with ID: {peer_id}, user_id: {user_id}, and read_only: {read_only}",
            self.doc_id
        );

        let mut peer_map = self.peer_map.write().await;
        let subscription = self.bc_group.subscribe(sink, stream, read_only);

        if !self.is_persistence_loop_task_running().await {
            self.clone().start_persistence_loop().await;
        }

        let sub_handle = tokio::spawn({
            let self_ref = Arc::clone(&self);
            async move {
                // Wait until the connection ends.
                let _ = subscription.completed().await;

                let mut peer_map = self_ref.peer_map.write().await;

                trace!(
                    "[{}] peer unsubscribed with ID: {peer_id} and user_id: {user_id}",
                    self_ref.doc_id
                );

                peer_map.remove(&peer_id);
            }
        });

        peer_map.insert(
            peer_id,
            Peer {
                id: user_id,
                role,
                subscription: sub_handle,
            },
        );

        Ok(())
    }

    /// Aborts the inner persistence loop task that has referenced this realm using an Arc and
    /// broadcasts the destroy reason to all the subscribed peers.
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
    ///
    /// This is the correct way to destroy a realm:
    ///
    /// ```rust,no-run
    /// let mut realm_outer = realm_map
    ///     .async_lock(doc_id, AsyncLimit::no_limit())
    ///     .await
    ///     .expect("unable to acquire the lock");
    /// let realm = realm_outer.value().expect("invalid realm");
    ///
    /// realm.destroy(reason).await;
    /// realm_outer.remove();
    /// ```
    #[async_recursion::async_recursion]
    pub async fn destroy(&self, reason: RealmDestroyReason) {
        {
            let is_being_destroyed = self.is_being_destroyed.read().await;

            if *is_being_destroyed {
                return;
            }
        }

        // Broadcast a realm destroy message to the peers with the reason.
        self.broadcast_internal_message(reason.to_string().as_ref())
            .await;

        // Unsubscribe all the peers
        {
            let mut peer_map = self.peer_map.write().await;

            for peer in peer_map.values() {
                peer.subscription.abort();
            }

            peer_map.clear();
        }

        if reason != RealmDestroyReason::DocOverload {
            // Persist any updates before destroying
            let _ = self.persist_doc_to_s3(true).await;
        }

        {
            let mut persistence_loop_task = self.persistence_loop_task.write().await;

            if persistence_loop_task.is_some() {
                if let Some(join_handle) = persistence_loop_task.as_ref() {
                    join_handle.abort();
                    *persistence_loop_task = None;
                }
            }
        }
    }

    /// Serializes the present document state to binary data, deflates it using GZIP, and uploads it
    /// to the S3 docs bucket. Returns the size (in bytes) of the document at the time of uploading
    /// it to the object storage.
    ///
    /// * `force` - If `true`, forces the document to be uploaded to the object storage, even if it
    ///   is not modified.
    #[tracing::instrument(
        name = "REALM persist_doc_to_s3",
        skip_all,
        fields(
            doc_id = self.doc_id,
            doc_key = self.doc_key
        ),
        err
    )]
    async fn persist_doc_to_s3(&self, force: bool) -> Result<usize, PersistDocError> {
        trace!("[{}] trying to persist the doc to s3", self.doc_id);

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
        if force || *last_state_vec != next_state_vec {
            debug!(
                "[{}] persisting the doc… ({})",
                self.doc_id,
                if force { "forced" } else { "not forced" }
            );

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
                warn!(
                    "[{}] exceeded the maximum document size ({doc_size} bytes), trying to compress with the highest level",
                    self.doc_id
                );

                compressed_bytes =
                    deflate_bytes_gzip(&doc_binary_data, Some(CompressionLevel::Best))
                        .await
                        .map_err(|err| PersistDocError::Compression(err.to_string()))?;
                doc_size = compressed_bytes.len();

                // If the document is still too large, we simply destroy the realm to avoid memory
                // issues. This should be a very rare case unless the peers are sending malformed
                // updates.
                if doc_size as u32 > MAX_DOCUMENT_SIZE {
                    error!(
                        "[{}] dropping due to unexpectedly large document size ({doc_size} bytes)",
                        self.doc_id
                    );

                    self.destroy_and_remove_from_map(RealmDestroyReason::DocOverload)
                        .await;
                }
            }

            timeout(
                Duration::from_secs(DOC_UPLOAD_TIMEOUT),
                self.s3_client
                    .put_object()
                    .bucket(S3_DOCS_BUCKET)
                    .key(&self.doc_key)
                    .content_type("application/octet-stream")
                    .content_encoding("gzip")
                    // Story ID
                    .metadata("sid", self.doc_id.to_string())
                    .body(compressed_bytes.into())
                    .send(),
            )
            .await
            .map_err(|timeout_error| PersistDocError::Upload(timeout_error.to_string()))?
            .map_err(|s3_error| s3_error.into_service_error())
            .map_err(|s3_error| PersistDocError::Upload(s3_error.to_string()))?;

            // Update the state vector after the compression and uploading process.
            *last_state_vec = next_state_vec;

            debug!("[{}] persisted {doc_size} bytes", self.doc_id);

            Ok(doc_size)
        } else {
            trace!(
                "aborting persistence call as the state vector was not modified since the last call"
            );

            // Document has not been updated since the last persistence call.
            Ok(0)
        }
    }

    /// Broadcasts an internal message to every connected peer.
    ///
    /// * `message` - The message value to broadcast.
    async fn broadcast_internal_message(&self, message: &str) {
        if self.has_peers().await {
            let _ = self.bc_group.broadcast_internal_message(message);
        }
    }

    /// Removes the realm from the realm map and aborts the document persistence loop task,
    /// eventually dropping the entire realm instance. This will free up the memory occupied by
    /// the document, and clear all the peers.
    async fn destroy_and_remove_from_map(&self, reason: RealmDestroyReason) {
        // Lock the document entry until the realm is destroyed. This should never throw.
        if let Ok(mut entry) = self
            .realm_map
            .async_lock(self.doc_id, AsyncLimit::no_limit())
            .await
        {
            self.destroy(reason).await;
            entry.remove();
        }
    }

    /// Returns `true` if the persistence loop task is running.
    async fn is_persistence_loop_task_running(&self) -> bool {
        let loop_task = self.persistence_loop_task.read().await;
        loop_task.is_some()
    }

    /// Spawns a child task that starts a document persistence loop, which internally calls the
    /// [Realm::persist_doc_to_s3] method every [PERSISTENCE_LOOP_DURATION] seconds. The task is
    /// aborted when the [Realm] instance is destroyed.
    #[tracing::instrument(
        name = "REALM start_persistence_loop",
        skip_all,
        fields(
            doc_id = self.doc_id,
            doc_key = self.doc_key
        )
    )]
    async fn start_persistence_loop(self: Arc<Self>) {
        let mut persistence_loop_task = self.persistence_loop_task.write().await;

        if persistence_loop_task.is_none() {
            trace!("[{}] starting persistence loop task", self.doc_id);

            let mut interval = interval(Duration::from_secs(PERSISTENCE_LOOP_DURATION));

            *persistence_loop_task = Some(tokio::spawn({
                let self_ref = Arc::clone(&self);
                async move {
                    loop {
                        interval.tick().await;

                        // Check for realm lifetime
                        if self_ref.created_at + REALM_LIFETIME
                            < OffsetDateTime::now_utc().unix_timestamp()
                        {
                            debug!("[{}] lifetime exceeded, dropping…", self_ref.doc_id);

                            self_ref
                                .destroy_and_remove_from_map(RealmDestroyReason::LifetimeExceeded)
                                .await;

                            return;
                        }

                        let is_first_persistence_iteration = self_ref.created_at
                            + (PERSISTENCE_LOOP_DURATION as i64)
                            > OffsetDateTime::now_utc().unix_timestamp();

                        let mut is_last_persistence_iteration =
                            self_ref.is_last_persistence_iteration.write().await;

                        // Always persist the document for the first persistence cycle
                        if is_first_persistence_iteration || self_ref.has_peers().await {
                            *is_last_persistence_iteration = false;
                            drop(is_last_persistence_iteration);

                            let _ = self_ref.persist_doc_to_s3(false).await;
                        } else if *is_last_persistence_iteration {
                            drop(is_last_persistence_iteration);

                            self_ref
                                .destroy_and_remove_from_map(RealmDestroyReason::Internal)
                                .await;
                        } else {
                            *is_last_persistence_iteration = true;

                            debug!(
                                "[{}] no subscriptions, dropping the realm on next cycle",
                                self_ref.doc_id
                            );
                        }
                    }
                }
            }));
        }
    }
}

impl Drop for Realm {
    fn drop(&mut self) {
        debug!("[{}] dropped", self.doc_id);
    }
}

#[cfg(test)]
mod tests {
    use super::{
        super::{
            awareness::Awareness,
            protocol::MSG_INTERNAL,
            server::tests::{
                init_realms_server_for_test,
                peer,
            },
        },
        *,
    };
    use crate::{
        test_utils::{
            get_s3_client,
            TestContext,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
    };
    use futures_util::{
        SinkExt,
        StreamExt,
    };
    use sqlx::PgPool;
    use storiny_macros::test_context;
    use yrs::{
        encoding::read::{
            Cursor,
            Read,
        },
        updates::decoder::DecoderV1,
        Doc,
    };

    /// Initializes and returns a tuple consisting of a realm map and a realm instance.
    ///
    /// * `doc_id` - The ID of the document.
    /// * `doc_key` - The UUID of the document, used as the key for the object storage.
    /// * `s3_client` - The S3 client instance.
    async fn init_realm(doc_id: i64, doc_key: &str, s3_client: S3Client) -> (RealmMap, Arc<Realm>) {
        let realm_map: RealmMap = Arc::new(LockableHashMap::new());
        let doc = Doc::new();
        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bc_group = BroadcastGroup::new(awareness, 10).await.unwrap();
        let realm = Arc::new(Realm::new(
            realm_map.clone(),
            s3_client.clone(),
            doc_id,
            doc_key.to_string(),
            bc_group,
        ));

        {
            let mut realm_guard = realm_map
                .async_lock(doc_id, AsyncLimit::no_limit())
                .await
                .unwrap();

            realm_guard.insert(realm.clone());
        }

        (realm_map, realm)
    }

    struct LocalTestContext {
        s3_client: S3Client,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client().await,
            }
        }

        async fn teardown(self) {
            delete_s3_objects_using_prefix(&self.s3_client, S3_DOCS_BUCKET, None, None)
                .await
                .unwrap();
        }
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[tokio::test]
        async fn can_create_a_realm_instance(ctx: &mut LocalTestContext) {
            let s3_client = &ctx.s3_client;
            let (realm_map, _) = init_realm(1_i64, "test", s3_client.clone()).await;

            let realm_guard = realm_map
                .async_lock(1_i64, AsyncLimit::no_limit())
                .await
                .unwrap();

            assert!(realm_guard.value().is_some());
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_subscribe_to_a_realm_instance(ctx: &mut LocalTestContext, pool: PgPool) {
            let s3_client = &ctx.s3_client;
            let (endpoint, realm_map, _, story_id) =
                init_realms_server_for_test(pool, Some(s3_client.clone()), true, true).await;
            let (_tx, _rx) = peer(endpoint).await;

            tokio::time::sleep(Duration::from_secs(5)).await;

            let realm_outer = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();
            let realm = realm_outer.value();

            assert!(realm.is_some())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_remove_a_peer_from_realm(ctx: &mut LocalTestContext, pool: PgPool) {
            let s3_client = &ctx.s3_client;
            let (endpoint, realm_map, user_id, story_id) =
                init_realms_server_for_test(pool, Some(s3_client.clone()), true, true).await;
            let (_tx, _rx) = peer(endpoint).await;

            tokio::time::sleep(Duration::from_secs(5)).await;

            let realm_outer = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();
            let realm = realm_outer.value().expect("realm not found");

            assert!(realm.has_peers().await);

            realm.remove_peer(user_id, false).await;

            assert!(!realm.has_peers().await);
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_update_the_role_of_a_peer(ctx: &mut LocalTestContext, pool: PgPool) {
            let s3_client = &ctx.s3_client;
            let (endpoint, realm_map, user_id, story_id) =
                init_realms_server_for_test(pool, Some(s3_client.clone()), true, true).await;
            let (mut tx, mut rx) = peer(endpoint).await;

            tokio::time::sleep(Duration::from_secs(5)).await;

            let realm_outer = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();
            let realm = realm_outer.value().expect("realm not found");

            assert_eq!(realm.get_peer_role(user_id).await, Some(PeerRole::Editor));

            realm.update_peer_role(user_id, PeerRole::Viewer).await;

            // The peer should receive an internal destroy message
            if let Ok(message) = rx.next().await.unwrap() {
                assert!(message.is_binary());

                let message_data = message.into_data();
                let mut decoder = DecoderV1::new(Cursor::new(&message_data));

                assert_eq!(decoder.read_var::<u8>().unwrap(), MSG_INTERNAL);
                assert_eq!(
                    decoder.read_string().unwrap().to_string(),
                    format!("role_update:{user_id}:{}", PeerRole::Viewer)
                );
            }

            tx.close().await.unwrap();

            // Should also remove the peer.
            assert!(!realm.has_peers().await);
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_destroy_a_realm_instance_with_a_reason(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) {
            let s3_client = &ctx.s3_client;
            let (endpoint, realm_map, _, story_id) =
                init_realms_server_for_test(pool, Some(s3_client.clone()), true, true).await;
            let (mut tx, mut rx) = peer(endpoint).await;

            tokio::time::sleep(Duration::from_secs(5)).await;

            let mut realm_outer = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();
            let realm = realm_outer.value().expect("realm not found");

            realm.destroy(RealmDestroyReason::Internal).await;
            realm_outer.remove();

            // The peer should receive an internal destroy message
            if let Ok(message) = rx.next().await.unwrap() {
                assert!(message.is_binary());

                let message_data = message.into_data();
                let mut decoder = DecoderV1::new(Cursor::new(&message_data));

                assert_eq!(decoder.read_var::<u8>().unwrap(), MSG_INTERNAL);
                assert_eq!(
                    decoder.read_string().unwrap().to_string(),
                    RealmDestroyReason::Internal.to_string()
                );
            }

            tx.close().await.unwrap();
        }

        mod long_running {
            use super::*;

            #[test_context(LocalTestContext)]
            #[sqlx::test]
            async fn can_destroy_the_realm_instance_after_the_last_peer_unsubscribes(
                ctx: &mut LocalTestContext,
                pool: PgPool,
            ) {
                let s3_client = &ctx.s3_client;
                let (endpoint, realm_map, _, story_id) =
                    init_realms_server_for_test(pool, Some(s3_client.clone()), true, true).await;
                let (mut tx, _) = peer(endpoint).await;

                tokio::time::sleep(Duration::from_secs(5)).await;

                {
                    // Realm should be present in the map
                    let realm = realm_map
                        .async_lock(story_id, AsyncLimit::no_limit())
                        .await
                        .unwrap();

                    assert!(realm.value().is_some());
                }

                // Drop the peer
                tx.close().await.unwrap();

                // The realm is guaranteed to be dropped within the next two persistence cycles.
                tokio::time::sleep(Duration::from_secs(PERSISTENCE_LOOP_DURATION * 2)).await;

                {
                    // Realm should not be present in the map
                    let realm = realm_map
                        .async_lock(story_id, AsyncLimit::no_limit())
                        .await
                        .unwrap();

                    assert!(realm.value().is_none());
                }
            }
        }
    }
}
