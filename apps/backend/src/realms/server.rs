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

                let inserted_doc_key = result.get::<Option<Uuid>, _>("inserted_doc_key");
                let editable_doc_key = result.get::<Option<Uuid>, _>("editable_doc_key");

                let final_doc_key: Option<Uuid> = {
                    if inserted_doc_key.is_some() {
                        inserted_doc_key
                    } else if editable_doc_key.is_some() {
                        editable_doc_key
                    } else {
                        None
                    }
                };

                if final_doc_key.is_none() {
                    return Err(EnterRealmError::Internal);
                }

                let final_doc_key = final_doc_key.unwrap();

                // Copy the original story data to a new editable document.
                if let Some(inserted_doc_key) = inserted_doc_key {
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
                                .copy_source(format!("{}/{original_doc_key}", S3_DOCS_BUCKET))
                                .send()
                                .await
                                .map_err(|_| EnterRealmError::Internal)?;
                        }
                        Err(error) => {
                            let _ = s3_client
                                .delete_object()
                                .bucket(S3_DOCS_BUCKET)
                                .key(inserted_doc_key.to_string())
                                .send()
                                .await;

                            if !matches!(error.into_service_error(), HeadObjectError::NotFound(_)) {
                                return Err(EnterRealmError::Internal);
                            }
                        }
                    }
                };

                final_doc_key
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
mod tests {
    use futures_util::{
        ready,
        stream::{
            SplitSink,
            SplitStream,
        },
        SinkExt,
        Stream,
        StreamExt,
    };
    use std::{
        net::SocketAddr,
        pin::Pin,
        str::FromStr,
        sync::Arc,
        task::{
            Context,
            Poll,
        },
        time::Duration,
    };
    use tokio::{
        net::TcpStream,
        sync::{
            Mutex,
            Notify,
            RwLock,
        },
        task,
        task::JoinHandle,
        time::{
            sleep,
            timeout,
        },
    };
    use tokio_tungstenite::{
        tungstenite::Message,
        MaybeTlsStream,
        WebSocketStream,
    };
    use warp::{
        ws::{
            WebSocket,
            Ws,
        },
        Filter,
        Rejection,
        Reply,
        Sink,
    };
    use y_sync::{
        awareness::Awareness,
        net::{
            BroadcastGroup,
            Connection,
        },
        sync::Error,
    };
    use yrs::{
        updates::encoder::Encode,
        Doc,
        GetString,
        Text,
        Transact,
        UpdateSubscription,
    };
    use yrs_warp::ws::{
        WarpSink,
        WarpStream,
    };

    async fn start_server(
        addr: &str,
        bcast: Arc<BroadcastGroup>,
    ) -> Result<JoinHandle<()>, Box<dyn std::error::Error>> {
        let addr = SocketAddr::from_str(addr)?;
        let ws = warp::path("test-room")
            .and(warp::ws())
            .and(warp::any().map(move || bcast.clone()))
            .and_then(ws_handler);

        Ok(tokio::spawn(async move {
            warp::serve(ws).run(addr).await;
        }))
    }

    async fn ws_handler(ws: Ws, bcast: Arc<BroadcastGroup>) -> Result<impl Reply, Rejection> {
        Ok(ws.on_upgrade(move |socket| peer(socket, bcast)))
    }

    async fn peer(ws: WebSocket, bcast: Arc<BroadcastGroup>) {
        let (sink, stream) = ws.split();
        let sink = Arc::new(Mutex::new(WarpSink::from(sink)));
        let stream = WarpStream::from(stream);
        let sub = bcast.subscribe(sink, stream);
        match sub.completed().await {
            Ok(_) => println!("broadcasting for channel finished successfully"),
            Err(e) => eprintln!("broadcasting for channel finished abruptly: {}", e),
        }
    }

    struct TungsteniteSink(SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>);

    impl Sink<Vec<u8>> for TungsteniteSink {
        type Error = Error;

        fn poll_ready(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(sink.poll_ready(cx));
            match result {
                Ok(_) => Poll::Ready(Ok(())),
                Err(e) => Poll::Ready(Err(Error::Other(Box::new(e)))),
            }
        }

        fn start_send(mut self: Pin<&mut Self>, item: Vec<u8>) -> Result<(), Self::Error> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = sink.start_send(Message::binary(item));
            match result {
                Ok(_) => Ok(()),
                Err(e) => Err(Error::Other(Box::new(e))),
            }
        }

        fn poll_flush(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(sink.poll_flush(cx));
            match result {
                Ok(_) => Poll::Ready(Ok(())),
                Err(e) => Poll::Ready(Err(Error::Other(Box::new(e)))),
            }
        }

        fn poll_close(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(sink.poll_close(cx));
            match result {
                Ok(_) => Poll::Ready(Ok(())),
                Err(e) => Poll::Ready(Err(Error::Other(Box::new(e)))),
            }
        }
    }

    struct TungsteniteStream(SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>);

    impl Stream for TungsteniteStream {
        type Item = Result<Vec<u8>, Error>;

        fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
            let stream = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(stream.poll_next(cx));
            match result {
                None => Poll::Ready(None),
                Some(Ok(msg)) => Poll::Ready(Some(Ok(msg.into_data()))),
                Some(Err(e)) => Poll::Ready(Some(Err(Error::Other(Box::new(e))))),
            }
        }
    }

    async fn client(
        addr: &str,
        doc: Doc,
    ) -> Result<Connection<TungsteniteSink, TungsteniteStream>, Box<dyn std::error::Error>> {
        let (stream, _) = tokio_tungstenite::connect_async(addr).await?;
        let (sink, stream) = stream.split();
        let sink = TungsteniteSink(sink);
        let stream = TungsteniteStream(stream);
        Ok(Connection::new(
            Arc::new(RwLock::new(Awareness::new(doc))),
            sink,
            stream,
        ))
    }

    fn create_notifier(doc: &Doc) -> (Arc<Notify>, UpdateSubscription) {
        let notify = Arc::new(Notify::new());
        let subscription = {
            let notify = notify.clone();
            doc.observe_update_v1(move |_, _| notify.notify_waiters())
                .unwrap()
        };

        (notify, subscription)
    }

    const TIMEOUT: Duration = Duration::from_secs(5);

    #[tokio::test]
    async fn change_introduced_by_server_reaches_subscribed_clients()
    -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        let text = doc.get_or_insert_text("test");
        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await;
        let server = start_server("0.0.0.0:6600", Arc::new(bcast)).await?;

        let doc = Doc::new();
        let (n, sub) = create_notifier(&doc);
        let c1 = client("ws://localhost:6600/test-room", doc).await?;

        {
            let lock = awareness.write().await;
            text.push(&mut lock.doc().transact_mut(), "abc");
        }

        timeout(TIMEOUT, n.notified()).await?;

        {
            let awareness = c1.awareness().read().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            let str = text.get_string(&doc.transact());
            assert_eq!(str, "abc".to_string());
        }

        Ok(())
    }

    #[tokio::test]
    async fn subscribed_client_fetches_initial_state() -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        let text = doc.get_or_insert_text("test");

        text.push(&mut doc.transact_mut(), "abc");

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await;
        let server = start_server("0.0.0.0:6601", Arc::new(bcast)).await?;

        let doc = Doc::new();
        let (n, sub) = create_notifier(&doc);
        let c1 = client("ws://localhost:6601/test-room", doc).await?;

        timeout(TIMEOUT, n.notified()).await?;

        {
            let awareness = c1.awareness().read().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            let str = text.get_string(&doc.transact());
            assert_eq!(str, "abc".to_string());
        }

        Ok(())
    }

    #[tokio::test]
    async fn changes_from_one_client_reach_others() -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        let text = doc.get_or_insert_text("test");

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await;
        let server = start_server("0.0.0.0:6602", Arc::new(bcast)).await?;

        let d1 = Doc::with_client_id(2);
        let c1 = client("ws://localhost:6602/test-room", d1).await?;
        // by default changes made by document on the client side are not propagated automatically
        let sub11 = {
            let sink = c1.sink();
            let a = c1.awareness().write().await;
            let doc = a.doc();
            doc.observe_update_v1(move |txn, e| {
                let update = e.update.to_owned();
                if let Some(sink) = sink.upgrade() {
                    task::spawn(async move {
                        let msg =
                            y_sync::sync::Message::Sync(y_sync::sync::SyncMessage::Update(update))
                                .encode_v1();
                        let mut sink = sink.lock().await;
                        sink.send(msg).await.unwrap();
                    });
                }
            })
            .unwrap()
        };

        let d2 = Doc::with_client_id(3);
        let (n2, sub2) = create_notifier(&d2);
        let c2 = client("ws://localhost:6602/test-room", d2).await?;

        {
            let a = c1.awareness().write().await;
            let doc = a.doc();
            let text = doc.get_or_insert_text("test");
            text.push(&mut doc.transact_mut(), "def");
        }

        timeout(TIMEOUT, n2.notified()).await?;

        {
            let awareness = c2.awareness().read().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            let str = text.get_string(&doc.transact());
            assert_eq!(str, "def".to_string());
        }

        Ok(())
    }

    #[tokio::test]
    async fn client_failure_doesnt_affect_others() -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        let text = doc.get_or_insert_text("test");

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await;
        let server = start_server("0.0.0.0:6603", Arc::new(bcast)).await?;

        let d1 = Doc::with_client_id(2);
        let c1 = client("ws://localhost:6603/test-room", d1).await?;
        // by default changes made by document on the client side are not propagated automatically
        let sub11 = {
            let sink = c1.sink();
            let a = c1.awareness().write().await;
            let doc = a.doc();
            doc.observe_update_v1(move |txn, e| {
                let update = e.update.to_owned();
                if let Some(sink) = sink.upgrade() {
                    task::spawn(async move {
                        let msg =
                            y_sync::sync::Message::Sync(y_sync::sync::SyncMessage::Update(update))
                                .encode_v1();
                        let mut sink = sink.lock().await;
                        sink.send(msg).await.unwrap();
                    });
                }
            })
            .unwrap()
        };

        let d2 = Doc::with_client_id(3);
        let (n2, sub2) = create_notifier(&d2);
        let c2 = client("ws://localhost:6603/test-room", d2).await?;

        let d3 = Doc::with_client_id(4);
        let (n3, sub3) = create_notifier(&d3);
        let c3 = client("ws://localhost:6603/test-room", d3).await?;

        {
            let a = c1.awareness().write().await;
            let doc = a.doc();
            let text = doc.get_or_insert_text("test");
            text.push(&mut doc.transact_mut(), "abc");
        }

        // on the first try both C2 and C3 should receive the update
        //timeout(TIMEOUT, n2.notified()).await.unwrap();
        //timeout(TIMEOUT, n3.notified()).await.unwrap();
        sleep(TIMEOUT).await;

        {
            let awareness = c2.awareness().read().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            let str = text.get_string(&doc.transact());
            assert_eq!(str, "abc".to_string());
        }
        {
            let awareness = c3.awareness().read().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            let str = text.get_string(&doc.transact());
            assert_eq!(str, "abc".to_string());
        }

        // drop client, causing abrupt ending
        drop(c3);
        drop(n3);
        drop(sub3);
        // C2 notification subscription has been realized, we need to refresh it
        drop(n2);
        drop(sub2);

        let (n2, sub2) = {
            let a = c2.awareness().write().await;
            let doc = a.doc();
            create_notifier(doc)
        };

        {
            let a = c1.awareness().write().await;
            let doc = a.doc();
            let text = doc.get_or_insert_text("test");
            text.push(&mut doc.transact_mut(), "def");
        }

        timeout(TIMEOUT, n2.notified()).await.unwrap();

        {
            let awareness = c2.awareness().read().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            let str = text.get_string(&doc.transact());
            assert_eq!(str, "abcdef".to_string());
        }

        Ok(())
    }
}
