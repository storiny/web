use deflate::{
    deflate_bytes_gzip_conf,
    Compression,
};
use futures_util::{
    StreamExt,
    TryFutureExt,
};
use gzip_header::GzBuilder;
use hashbrown::{
    hash_map::Entry,
    HashMap,
};
use std::{
    convert::Infallible,
    sync::Arc,
};
use thiserror::Error;
use tokio::{
    signal::unix::{
        signal,
        SignalKind,
    },
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
use warp::{
    ws::{
        WebSocket,
        Ws,
    },
    Filter,
    Rejection,
    Reply,
};
use y_sync::{
    awareness::Awareness,
    net::BroadcastGroup,
    sync::Error,
};
use yrs::{
    ReadTxn,
    StateVector,
    Transact,
};
use yrs_warp::ws::{
    WarpSink,
    WarpStream,
};

/// The maximum number of overflowing messages that are buffered in the memory for the broadcast
/// group.
const BUFFER_CAP: usize = 35;

/// The maximum number of peers that can connect to a single realm.
const MAX_PEERS_PER_REALM: usize = 3;

/// The loop interval duration (in seconds) after which the document gets persisted to the object
/// storage.
const PERSISTENCE_LOOP_DURATION: u64 = 180; // 3 minutes

/// The duration (in seconds) for which an empty realm (realm with no connected peers) is kept in
/// the memory. This is to avoid downloading the entire document from the object storage again if
/// the client gets disconnected just for a few seconds. The document is persisted to the object
/// storage just before the realm is destroyed.
const EMPTY_REALM_TIMEOUT: u64 = 45; // 45 seconds

/// The realm map. Key corresponds to the document ID, while values are the respective realm manager
/// instances.
pub type RealmMap = Arc<Mutex<HashMap<String, Arc<Realm>>>>;

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
    /// The ID of the document being edited.
    pub doc_id: String,
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

/// The error raised while persisting a document using the [Realm::serialize_doc_to_s3] method.
#[derive(Error, Debug)]
pub enum PersistDocError {
    #[error("unable to acquire transaction on the doc")]
    DocTransactionAck,
    #[error("unable to upload the doc to s3: {0}")]
    Upload(String),
}

impl Realm {
    /// Creates a new realm.
    ///
    /// * `realm_map` - The realm map.
    /// * `doc_id` - The ID of the document.
    /// * `bc_group` - The broadcast group instance.
    pub fn new(realm_map: RealmMap, doc_id: String, bc_group: BroadcastGroup) -> Self {
        Self {
            bc_group,
            doc_id,
            realm_map,
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
        let txn = doc
            .try_transact()
            .map_err(|_| PersistDocError::DocTransactionAck)?;

        let next_state_vec = txn.state_vector();

        // Document has been updated since the last persistence call.
        if *last_state_vec != next_state_vec {
            let doc_binary_data = txn.encode_state_as_update_v2(&StateVector::default());
            let gzipped_bytes =
                deflate_bytes_gzip_conf(&doc_binary_data, Compression::Fast, GzBuilder::new());
            let doc_size = gzipped_bytes.len();

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
    pub async fn destroy(&self) {
        let mut realm_map = self.realm_map.lock().await;
        let mut persistence_loop_task = self.persistence_loop_task.lock().await;
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
        let subscription = self.bc_group.subscribe(sink, stream);

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
            if self.no_peers().await {
                match self.persist_doc_to_s3().await {
                    Ok(doc_size) => log::info!(
                        "Dropped realm with ID: `{}`. Persisted {doc_size} bytes.",
                        self.doc_id
                    ),
                    Err(error) => log::info!(
                        "Dropped realm with ID: `{}`. Failed to persist the document: {error}",
                        self.doc_id
                    ),
                };

                self.destroy().await;
            }
        }
    }

    /// Increments the `peer_count` by one.
    async fn increment_peer_count(&self) {
        let mut peer_count = self.peer_count.lock().await;
        *peer_count += 1;
    }

    /// Returns `true` if there are no peers subscribed to this realm.
    async fn no_peers(&self) -> bool {
        let peer_count = self.peer_count.lock().await;
        *peer_count == 0
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

pub async fn start() {
    let realm_map: RealmMap = Arc::new(Mutex::new(HashMap::new()));

    fn with_realms(
        realm_map: RealmMap,
    ) -> impl Filter<Extract = (RealmMap,), Error = Infallible> + Clone {
        warp::any().map(move || realm_map.clone())
    }

    pub async fn join_or_create_realm(
        doc_id: String,
        realm_map: RealmMap,
    ) -> Result<Arc<Realm>, Infallible> {
        let inner_realm_map = realm_map.clone();
        let mut inner_realm_map = inner_realm_map.lock().await;

        let realm = match inner_realm_map.entry(doc_id.clone()) {
            Entry::Vacant(entry) => {
                log::info!("Creating a new realm with ID: `{doc_id}`");
                let awareness = Arc::new(RwLock::new(Awareness::default()));
                let bc_group = BroadcastGroup::new(awareness, BUFFER_CAP).await;
                let realm = Arc::new(Realm::new(realm_map, doc_id, bc_group));
                entry.insert(realm).clone()
            }
            Entry::Occupied(entry) => {
                log::info!("Joining an existing realm with ID: `{doc_id}`");
                entry.get().clone()
            }
        };

        Ok(realm)
    }

    let ws = warp::any()
        .and(warp::path::param::<String>())
        .and(with_realms(realm_map))
        .and_then(join_or_create_realm)
        .and(warp::ws())
        .and_then(ws_handler);

    let mut stream = signal(SignalKind::terminate()).unwrap();

    let (_, server) =
        warp::serve(ws).bind_with_graceful_shutdown(([0, 0, 0, 0], 8081), async move {
            stream.recv().await;
        });

    tokio::task::spawn(server);
}

async fn ws_handler(realm: Arc<Realm>, ws: Ws) -> Result<impl Reply, Rejection> {
    Ok(ws.on_upgrade(move |socket| peer(socket, realm)))
}

async fn peer(ws: WebSocket, realm: Arc<Realm>) {
    let (sink, stream) = ws.split();
    let sink = Arc::new(Mutex::new(WarpSink::from(sink)));
    let stream = WarpStream::from(stream);
    realm.subscribe(sink, stream).await;
}
