use crate::{
    config::get_app_config,
    constants::buckets::S3_DOCS_BUCKET,
    realms::realm::{
        Realm,
        RealmMap,
    },
};
use flate2::read;
use futures_util::StreamExt;
use hashbrown::{
    hash_map::Entry,
    HashMap,
};
use rusoto_s3::{
    GetObjectRequest,
    S3Client,
    S3,
};
use sqlx::{
    Pool,
    Postgres,
    Row,
};
use std::{
    convert::Infallible,
    io::Read,
    net::SocketAddr,
    ops::Deref,
    sync::Arc,
};
use tokio::{
    io::AsyncReadExt,
    signal::unix::{
        signal,
        SignalKind,
    },
    sync::{
        Mutex,
        RwLock,
    },
};
use uuid::Uuid;
use warp::{
    ws::{
        WebSocket,
        Ws,
    },
    Filter,
    Rejection,
};
use y_sync::{
    awareness::Awareness,
    net::BroadcastGroup,
};
use yrs::{
    updates::decoder::Decode,
    Doc,
    Transact,
    Update,
};
use yrs_warp::ws::{
    WarpSink,
    WarpStream,
};

/// The maximum number of overflowing messages that are buffered in the memory for the broadcast
/// group.
const BUFFER_CAP: usize = 35;

/// Joins an existing realm or creates a new one for the provided document ID.
///
/// * `doc_id` - The document (story) ID.
/// * `realm_map` - The realm map.
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
async fn join_or_create_realm(
    doc_id: i64,
    realm_map: RealmMap,
    db_pool: Arc<Pool<Postgres>>,
    s3_client: Arc<S3Client>,
) -> Result<Arc<Realm>, Infallible> {
    let inner_realm_map = realm_map.clone();
    let mut inner_realm_map = inner_realm_map.lock().await;

    let realm = match inner_realm_map.entry(doc_id.clone()) {
        Entry::Vacant(entry) => {
            log::info!("Validating realm for ID: `{doc_id}`");

            let story = sqlx::query(
                r#"
                SELECT key FROM documents
                WHERE story_id = $1
                "#,
            )
            .bind(&doc_id)
            .fetch_one(db_pool.deref())
            .await
            // TODO: Remove unwraps, here and below
            .unwrap();

            let doc_key = story.get::<Uuid, _>("key");
            let mut body = Vec::new();

            if let Ok(req) = s3_client
                .deref()
                .get_object(GetObjectRequest {
                    bucket: S3_DOCS_BUCKET.to_string(),
                    key: doc_key.to_string(),
                    ..Default::default()
                })
                .await
            {
                let mut gzipped_body = Vec::new();
                let mut stream = req.body.unwrap().into_async_read();
                stream.read_to_end(&mut gzipped_body).await.unwrap();

                let mut gz = read::GzDecoder::new(&gzipped_body[..]);
                gz.read_to_end(&mut body).unwrap();
            }

            log::info!("Creating a new realm with ID: `{doc_id}`");

            let doc = Doc::new();

            // The transaction is automatically committed at the end of this scope.
            if !body.is_empty() {
                let mut txn = doc.transact_mut();
                let update = Update::decode_v2(&body).unwrap();
                txn.apply_update(update);
            }

            let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
            let bc_group = BroadcastGroup::new(awareness, BUFFER_CAP).await;
            let realm = Arc::new(Realm::new(
                realm_map.clone(),
                s3_client.clone(),
                doc_id,
                doc_key.to_string(),
                bc_group,
            ));

            entry.insert(realm).clone()
        }
        Entry::Occupied(entry) => {
            log::info!("Joining an existing realm with ID: `{doc_id}`");
            entry.get().clone()
        }
    };

    Ok(realm)
}

pub async fn start_realms_server(
    db_pool: Pool<Postgres>,
    s3_client: S3Client,
) -> std::io::Result<()> {
    let config = get_app_config().expect("Unable to load the environment configuration");
    let host = config.realms_host.to_string();
    let port = config.realms_port.clone().parse::<u16>().unwrap();
    let socket_addr: SocketAddr = format!(
        "{}:{}",
        if config.is_dev { "127.0.0.1" } else { &host },
        &port
    )
    .parse()
    .expect("unable to parse the socket address");

    let realm_map: RealmMap = Arc::new(Mutex::new(HashMap::new()));
    let db_pool = Arc::new(db_pool);
    let s3_client = Arc::new(s3_client);

    log::info!(
        "{}",
        format!("Starting realms server at http://{}:{}", &host, &port)
    );

    let realms = warp::any()
        .and(warp::path::param::<i64>())
        .and(warp::any().map(move || realm_map.clone()))
        .and(warp::any().map(move || db_pool.clone()))
        .and(warp::any().map(move || s3_client.clone()))
        .and_then(join_or_create_realm)
        .and(warp::ws())
        .and_then(|realm, ws: Ws| async move {
            Ok::<_, Rejection>(ws.on_upgrade(move |socket| peer(socket, realm)))
        });

    let mut stream = signal(SignalKind::terminate()).unwrap();
    let (_, server) = warp::serve(realms).bind_with_graceful_shutdown(socket_addr, async move {
        stream.recv().await;
    });

    tokio::task::spawn(server);

    Ok(())
}

async fn peer(ws: WebSocket, realm: Arc<Realm>) {
    let (sink, stream) = ws.split();
    let sink = Arc::new(Mutex::new(WarpSink::from(sink)));
    let stream = WarpStream::from(stream);
    realm.subscribe(sink, stream).await;
}
