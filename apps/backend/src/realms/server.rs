use crate::{
    config::{
        get_app_config,
        Config,
    },
    constants::{
        buckets::S3_DOCS_BUCKET,
        redis_namespaces::RedisNamespace,
    },
    realms::realm::{
        Realm,
        RealmMap,
    },
    utils::{
        extract_session_key_from_cookie::extract_session_key_from_cookie,
        get_user_sessions::UserSession,
        inflate_bytes_gzip::inflate_bytes_gzip,
    },
    RedisPool,
    S3Client,
};
use aws_sdk_s3::operation::{
    get_object::GetObjectError,
    head_object::HeadObjectError,
};
use cookie::Key;
use futures_util::{
    SinkExt,
    StreamExt,
};
use lockable::AsyncLimit;
use redis::AsyncCommands;
use serde::{
    Deserialize,
    Serialize,
};
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
use strum_macros::Display;
use thiserror::Error;
use time::OffsetDateTime;
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
    reply,
    ws::{
        self,
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
enum FetchDocError {
    #[error("unable to fetch the doc from S3: {0}")]
    ObjectError(#[from] GetObjectError),
    #[error("unable to decompress the document: {0}")]
    Decompression(String),
}

/// The error raised while entering a realm. Integer value represent the [code] for
/// closing the websocket connection while the string value represent the [reason].
///
/// [code]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close#code
/// [reason]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close#reason
#[derive(Display, Debug)]
#[repr(u16)]
pub enum EnterRealmError {
    #[strum(serialize = "Missing story")]
    MissingStory = 3001,
    #[strum(serialize = "The realm is full. Try again later.")]
    Full = 3002,
    #[strum(serialize = "You do not have the sufficient permissions to enter this realm")]
    Forbidden = 3003,
    #[strum(serialize = "You are not authorized to enter this realm")]
    Unauthorized = 3004,
    #[strum(serialize = "The document data has been corrupted")]
    DocCorrupted = 3005,
    #[strum(serialize = "Internal error raised while trying to enter the realm")]
    Internal = 4000,
}

/// The error response with a reason.
#[derive(Debug, Serialize)]
struct ErrorResponse {
    reason: String,
}

/// The query parameters received on the handshake request.
#[derive(Debug, Deserialize)]
struct PeerQuery {
    auth_token: Option<String>,
}

/// Rejection handler that maps rejections into responses.
async fn handle_rejection(err: Rejection) -> Result<impl Reply, Infallible> {
    if err.is_not_found() {
        Ok(reply::with_status("Not found", StatusCode::NOT_FOUND).into_response())
    } else {
        log::warn!("unhandled rejection: {:?}", err);
        Ok(
            reply::with_status("Procedure not found", StatusCode::INTERNAL_SERVER_ERROR)
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
            stream
                .read_to_end(&mut compressed_data)
                .await
                .map_err(|error| FetchDocError::Decompression(error.to_string()))?;

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

/// Joins an existing realm or creates a new one for the provided document ID. Returns a tuple
/// containing of the user ID and the realm reference.
///
/// * `config` - The environment configuration.
/// * `story_id` - The document (story) ID.
/// * `peer_query` - The query parameters sent by the peer.
/// * `realm_map` - The realm map.
/// * `db_pool` - The Postgres connection pool.
/// * `redis_pool` - The Redis connection pool.
/// * `s3_client` - The S3 client instance.
async fn enter_realm(
    config: Arc<Config>,
    story_id: i64,
    peer_query: PeerQuery,
    realm_map: RealmMap,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
    s3_client: S3Client,
) -> Result<(i64, Arc<Realm>), EnterRealmError> {
    let user_id = {
        let secret_key = Key::from(config.session_secret_key.as_bytes());
        let session_key = extract_session_key_from_cookie(
            &peer_query.auth_token.unwrap_or_default(),
            &secret_key,
        )
        .ok_or(EnterRealmError::Unauthorized)?;

        let mut redis_conn = redis_pool
            .get()
            .await
            .map_err(|_| EnterRealmError::Internal)?;

        let session_value = redis_conn
            .get::<_, Option<String>>(format!(
                "{}:{session_key}",
                RedisNamespace::Session.to_string()
            ))
            .await
            .map_err(|_| EnterRealmError::Internal)?
            .ok_or(EnterRealmError::Unauthorized)?;

        serde_json::from_str::<UserSession>(&session_value)
            .map_err(|_| EnterRealmError::Internal)?
            .user_id
    };

    let mut txn = db_pool
        .begin()
        .await
        .map_err(|_| EnterRealmError::Internal)?;

    let story = sqlx::query(
        r#"
        SELECT id, published_at FROM stories
        WHERE
            id = $1
            AND user_id = $2
            AND deleted_at IS NULL
        "#,
    )
    .bind(&story_id)
    .bind(&user_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            EnterRealmError::MissingStory
        } else {
            EnterRealmError::Internal
        }
    })?;

    let mut realm_guard = realm_map
        .async_lock(story_id.clone(), AsyncLimit::no_limit())
        .await
        // This should never throw
        .map_err(|_| EnterRealmError::Internal)?;

    if let Some(realm) = realm_guard.value() {
        txn.commit().await.map_err(|_| EnterRealmError::Internal)?;

        if !realm.can_join().await {
            return Err(EnterRealmError::Full);
        }

        log::info!("[{story_id}] Joining realm…");

        Ok((user_id, realm.clone()))
    } else {
        let doc_key = {
            if story
                .get::<Option<OffsetDateTime>, _>("published_at")
                .is_some()
            {
                log::info!("reach 1");
                // Fetch the editable document
                let result = sqlx::query(
                    r#"
                    WITH original_document AS (
                        SELECT key FROM documents
                        WHERE
                            story_id = $1
                            AND is_editable IS FALSE
                    ), editable_document AS (
                        SELECT key FROM documents
                        WHERE
                            story_id = $1
                            AND is_editable IS TRUE
                    ), inserted_document AS (
                        INSERT INTO documents (story_id, is_editable)
                        SELECT $1, TRUE
                        WHERE NOT EXISTS (
                            SELECT 1 FROM editable_document
                        )
                        RETURNING key
                    )
                    SELECT
                        (SELECT key FROM original_document) AS "original_doc_key",
                        (SELECT key FROM inserted_document) AS "inserted_doc_key",
                        (SELECT key FROM editable_document) AS "editable_doc_key"
                    "#,
                )
                .bind(&story_id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|error| {
                    if matches!(error, sqlx::Error::RowNotFound) {
                        EnterRealmError::MissingStory
                    } else {
                        EnterRealmError::Internal
                    }
                })?;

                log::info!("reach 2");

                // Copy the original story data to a new editable document.
                if let Some(inserted_doc_key) = result.get::<Option<Uuid>, _>("inserted_doc_key") {
                    let original_doc_key = result.get::<Uuid, _>("original_doc_key").to_string();

                    match s3_client
                        .head_object()
                        .bucket(S3_DOCS_BUCKET)
                        .key(&original_doc_key)
                        .send()
                        .await
                    {
                        Ok(_) => {
                            s3_client
                                .copy_object()
                                .bucket(S3_DOCS_BUCKET)
                                .key(inserted_doc_key.to_string())
                                .copy_source(format!("{}/{original_doc_key}", S3_DOCS_BUCKET,))
                                .send()
                                .await
                                .map_err(|_| EnterRealmError::Internal)?;
                        }
                        Err(error) => {
                            if !matches!(error.into_service_error(), HeadObjectError::NotFound(_)) {
                                return Err(EnterRealmError::Internal);
                            }
                        }
                    }
                };

                log::info!("reach 3");

                result
                    .get::<Option<Uuid>, _>("inserted_doc_key")
                    .unwrap_or(result.get::<Uuid, _>("editable_doc_key"))
            } else {
                sqlx::query(
                    r#"
                    SELECT key FROM documents
                    WHERE story_id = $1
                    "#,
                )
                .bind(&story_id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|error| {
                    if matches!(error, sqlx::Error::RowNotFound) {
                        EnterRealmError::MissingStory
                    } else {
                        EnterRealmError::Internal
                    }
                })?
                .get::<Uuid, _>("key")
            }
        };

        txn.commit().await.map_err(|_| EnterRealmError::Internal)?;

        let doc_body = fetch_doc_from_s3(&s3_client, &doc_key.to_string())
            .await
            .map_err(|_| EnterRealmError::Internal)?;

        log::info!("[{story_id}] Created realm");

        let doc = Doc::new();

        // The transaction is automatically committed at the end of this scope.
        if !doc_body.is_empty() {
            let mut txn = doc.transact_mut();
            let update = Update::decode_v2(&doc_body).map_err(|_| EnterRealmError::DocCorrupted)?;
            txn.apply_update(update);
        }

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bc_group = BroadcastGroup::new(awareness, BUFFER_CAP).await;
        let realm = Arc::new(Realm::new(
            realm_map.clone(),
            s3_client.clone(),
            story_id,
            doc_key.to_string(),
            bc_group,
        ));

        realm_guard.insert(realm.clone());

        Ok((user_id, realm))
    }
}

/// Incoming realm peer handler.
async fn peer_handler(
    ws: WebSocket,
    config: Arc<Config>,
    story_id: i64,
    peer_query: PeerQuery,
    realm_map: RealmMap,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
    s3_client: S3Client,
) {
    match enter_realm(
        config, story_id, peer_query, realm_map, db_pool, redis_pool, s3_client,
    )
    .await
    {
        Ok((user_id, realm)) => {
            let peer_id = Uuid::new_v4();
            let (sink, stream) = ws.split();
            let sink = Arc::new(Mutex::new(WarpSink::from(sink)));
            let stream = WarpStream::from(stream);
            let _ = realm.subscribe(peer_id, user_id, sink, stream).await;
        }
        Err(error) => {
            let (mut tx, _) = ws.split();
            let reason = error.to_string();
            let _ = tx.send(ws::Message::close_with(error as u16, reason)).await;
        }
    }
}

/// Starts the realms server.
///
/// * `realm_map` - The realm map.
/// * `db_pool` - The Postgres connection pool.
/// * `redis_pool` - The Redis connection pool.
/// * `s3_client` - The S3 client instance.
pub async fn start_realms_server(
    realm_map: RealmMap,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
    s3_client: S3Client,
) -> std::io::Result<()> {
    let config = Arc::new(get_app_config().expect("Unable to load the environment configuration"));
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

    let realms_router = warp::get()
        .and(warp::path::end())
        .map(|| "Storiny realms server")
        // /health
        .or(warp::get().and(warp::path("health")).map(|| "OK"))
        // /doc_id
        .or(warp::get()
            .and(warp::any().map(move || config.clone()))
            .and(warp::path::param::<i64>())
            .and(warp::query::<PeerQuery>())
            .and(warp::any().map(move || realm_map.clone()))
            .and(warp::any().map(move || db_pool.clone()))
            .and(warp::any().map(move || redis_pool.clone()))
            .and(warp::any().map(move || s3_client.clone()))
            .and(warp::ws())
            .and_then(
                |config,
                 story_id,
                 peer_query,
                 realm_map,
                 db_pool,
                 redis_pool,
                 s3_client,
                 ws: Ws| async move {
                    Ok::<_, Rejection>(ws.on_upgrade(move |socket| {
                        peer_handler(
                            socket, config, story_id, peer_query, realm_map, db_pool, redis_pool,
                            s3_client,
                        )
                    }))
                },
            ))
        .recover(handle_rejection);

    let mut stream = signal(SignalKind::terminate()).unwrap();
    let (_, server) =
        warp::serve(realms_router).bind_with_graceful_shutdown(socket_addr, async move {
            stream.recv().await;
        });

    tokio::task::spawn(server);

    Ok(())
}

#[cfg(test)]
mod tests {}
