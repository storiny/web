use crate::{
    config::get_app_config,
    constants::buckets::S3_DOCS_BUCKET,
    realms::realm::{
        Realm,
        RealmMap,
    },
    utils::inflate_bytes_gzip::inflate_bytes_gzip,
    S3Client,
};
use aws_sdk_s3::operation::get_object::GetObjectError;
use futures_util::StreamExt;
use hashbrown::hash_map::Entry;
use serde::Serialize;
use sqlx::{
    Pool,
    Postgres,
    Row,
};
use std::{
    convert::Infallible,
    net::SocketAddr,
    sync::Arc,
};
use thiserror::Error;
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
    http::StatusCode,
    reject,
    reject::Reject,
    reply,
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
const BUFFER_CAP: usize = 36;

/// The error raised while fetching a document from the object storage using the [fetch_doc_from_s3]
/// function.
#[derive(Error, Debug)]
pub enum FetchDocError {
    #[error("unable to fetch the doc from S3: {0}")]
    ObjectError(#[from] GetObjectError),
    #[error("unable to decompress the document: {0}")]
    Decompression(String),
}

/// The error raised while entering a realm.
#[derive(Error, Debug)]
pub enum EnterRealmError {
    #[error("the story could not be found in the database")]
    MissingStory,
    #[error("the realm is full and no more peers can subscribe")]
    Full,
    #[error("the peer is not allowed to enter the realm due to missing permissions")]
    Forbidden,
    #[error("error while fetching the doc from s3")]
    FetchDoc(#[from] FetchDocError),
    #[error("unable to enter the realm due to an internal error: {0}")]
    Internal(String),
}

impl Reject for EnterRealmError {}

/// The error response with a reason.
#[derive(Debug, Serialize)]
struct ErrorResponse {
    reason: String,
}

/// Rejection handler that maps rejections into responses.
async fn handle_rejection(err: Rejection) -> Result<impl Reply, Infallible> {
    if err.is_not_found() {
        Ok(reply::with_status("Not found", StatusCode::NOT_FOUND).into_response())
    } else if let Some(realm_error) = err.find::<EnterRealmError>() {
        match realm_error {
            EnterRealmError::MissingStory => Ok(reply::with_status(
                reply::json(&ErrorResponse {
                    reason: "unknown_story".to_string(),
                }),
                StatusCode::BAD_REQUEST,
            )
            .into_response()),
            EnterRealmError::Full => Ok(reply::with_status(
                reply::json(&ErrorResponse {
                    reason: "realm_full".to_string(),
                }),
                StatusCode::BAD_REQUEST,
            )
            .into_response()),
            EnterRealmError::Forbidden => Ok(reply::with_status(
                reply::json(&ErrorResponse {
                    reason: "forbidden".to_string(),
                }),
                StatusCode::FORBIDDEN,
            )
            .into_response()),
            EnterRealmError::FetchDoc(_) | EnterRealmError::Internal(_) => Ok(reply::with_status(
                reply::json(&ErrorResponse {
                    reason: "internal".to_string(),
                }),
                StatusCode::INTERNAL_SERVER_ERROR,
            )
            .into_response()),
        }
    } else {
        log::error!("unhandled rejection: {:?}", err);
        Ok(
            reply::with_status("Internal server error", StatusCode::INTERNAL_SERVER_ERROR)
                .into_response(),
        )
    }
}

/// Fetches a document from the S3 object storage and returns the decompressed binary data.
///
/// * `s3_client` - The S3 client instance.
/// * `doc_key` - The key of the document.
async fn fetch_doc_from_s3(s3_client: &S3Client, doc_key: &str) -> Result<Vec<u8>, FetchDocError> {
    match s3_client
        .get_object()
        .bucket(S3_DOCS_BUCKET)
        .key(doc_key)
        .send()
        .await
        .map_err(|error| error.into_service_error())
    {
        Ok(output) => {
            let mut compressed_data = Vec::new();
            let mut stream = output.body.into_async_read();
            stream.read_to_end(&mut compressed_data).await.unwrap();

            // Inflate the binary data
            Ok(inflate_bytes_gzip(&compressed_data)
                .await
                .map_err(|error| FetchDocError::Decompression(error.to_string()))?)
        }
        Err(error) => {
            if matches!(error, GetObjectError::NoSuchKey(_)) {
                // This document has been opened for the first time as it is not present in the
                // object storage. An object will get uploaded by the realm manager when this
                // document gets updated by the peers.
                Ok(Vec::new())
            } else {
                Err(FetchDocError::from(error))
            }
        }
    }
}

/// Joins an existing realm or creates a new one for the provided document ID.
///
/// * `doc_id` - The document (story) ID.
/// * `realm_map` - The realm map.
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
async fn enter_realm(
    doc_id: i64,
    realm_map: RealmMap,
    db_pool: Pool<Postgres>,
    s3_client: S3Client,
) -> Result<Arc<Realm>, Rejection> {
    let inner_realm_map = realm_map.clone();
    let mut inner_realm_map = inner_realm_map.lock().await;

    let realm = match inner_realm_map.entry(doc_id.clone()) {
        Entry::Vacant(entry) => {
            log::info!("Validating realm for ID: `{doc_id}`");

            let story_doc = sqlx::query(
                r#"
                SELECT key FROM documents
                WHERE story_id = $1
                "#,
            )
            .bind(&doc_id)
            .fetch_one(&db_pool)
            .await
            .map_err(|error| {
                reject::custom(if matches!(error, sqlx::Error::RowNotFound) {
                    EnterRealmError::MissingStory
                } else {
                    EnterRealmError::Internal(error.to_string())
                })
            })?;

            let doc_key = story_doc.get::<Uuid, _>("key").to_string();
            let doc_body = fetch_doc_from_s3(&s3_client, &doc_key)
                .await
                .map_err(|error| reject::custom(EnterRealmError::from(error)))?;

            log::info!("Creating a new realm with ID: `{doc_id}`");

            let doc = Doc::new();

            // The transaction is automatically committed at the end of this scope.
            if !doc_body.is_empty() {
                let mut txn = doc.transact_mut();
                let update = Update::decode_v2(&doc_body).unwrap();
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
            let realm_entry = entry.get();

            if !realm_entry.can_join().await {
                return Err(reject::custom(EnterRealmError::Full));
            }

            log::info!("Joining an existing realm with ID: `{doc_id}`");
            realm_entry.clone()
        }
    };

    Ok(realm)
}

/// Incoming realm peer handler.
async fn peer(ws: WebSocket, realm: Arc<Realm>) {
    let (sink, stream) = ws.split();
    let sink = Arc::new(Mutex::new(WarpSink::from(sink)));
    let stream = WarpStream::from(stream);
    realm.subscribe(sink, stream).await;
}

/// Starts the realms server.
///
/// * `realm_map` - The realm map.
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
pub async fn start_realms_server(
    realm_map: RealmMap,
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

    log::info!(
        "{}",
        format!("Starting realms server at http://{}:{}", &host, &port)
    );

    let realms = warp::any()
        .and(warp::path::param::<i64>())
        .and(warp::any().map(move || realm_map.clone()))
        .and(warp::any().map(move || db_pool.clone()))
        .and(warp::any().map(move || s3_client.clone()))
        .and_then(enter_realm)
        .and(warp::ws())
        .and_then(|realm, ws: Ws| async move {
            Ok::<_, Rejection>(ws.on_upgrade(move |socket| peer(socket, realm)))
        })
        .recover(handle_rejection);

    let mut stream = signal(SignalKind::terminate()).unwrap();
    let (_, server) = warp::serve(realms).bind_with_graceful_shutdown(socket_addr, async move {
        stream.recv().await;
    });

    tokio::task::spawn(server);

    Ok(())
}
