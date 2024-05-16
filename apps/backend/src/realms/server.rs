use super::{
    awareness::Awareness,
    broadcast::BroadcastGroup,
    connection::{
        RealmSink,
        RealmStream,
    },
    realm::{
        Realm,
        RealmMap,
    },
};
use crate::{
    config::{
        get_app_config,
        Config,
    },
    constants::{
        buckets::S3_DOCS_BUCKET,
        redis_namespaces::RedisNamespace,
        session_cookie::SESSION_COOKIE_NAME,
    },
    realms::realm::PeerRole,
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
use sqlx::{
    Pool,
    Postgres,
    Row,
};
use std::{
    convert::Infallible,
    net::SocketAddr,
    str::FromStr,
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
use tracing::{
    debug,
    error,
    trace,
    warn,
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
use yrs::{
    updates::decoder::Decode,
    Doc,
    Transact,
    Update,
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

/// Rejection handler that maps rejections into responses.
async fn handle_rejection(err: Rejection) -> Result<impl Reply, Infallible> {
    if err.is_not_found() {
        Ok(reply::with_status("Not found", StatusCode::NOT_FOUND).into_response())
    } else {
        warn!("unhandled rejection: {:?}", err);
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
/// containing of the user ID, the role, and the realm reference.
///
/// * `config` - The environment configuration.
/// * `story_id` - The document (story) ID.
/// * `session_cookie_value` - The value of the session cookie.
/// * `realm_map` - The realm map.
/// * `db_pool` - The Postgres connection pool.
/// * `redis_pool` - The Redis connection pool.
/// * `s3_client` - The S3 client instance.
#[tracing::instrument(skip_all, fields(story_id), err)]
async fn enter_realm(
    config: Arc<Config>,
    story_id: i64,
    session_cookie_value: Option<String>,
    realm_map: RealmMap,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
    s3_client: S3Client,
) -> Result<(i64, PeerRole, Arc<Realm>), EnterRealmError> {
    let user_id = {
        if session_cookie_value.is_none() {
            return Err(EnterRealmError::Unauthorized);
        }

        let secret_key = Key::from(config.session_secret_key.as_bytes());
        let session_key =
            extract_session_key_from_cookie(&session_cookie_value.unwrap_or_default(), &secret_key)
                .ok_or(EnterRealmError::Unauthorized)?;

        let mut redis_conn = redis_pool.get().await.map_err(|error| {
            error!("unable to acquire a Redis connection from the pool: {error:?}");
            EnterRealmError::Internal
        })?;

        let session_value = redis_conn
            .get::<_, Option<Vec<u8>>>(format!("{}:{session_key}", RedisNamespace::Session))
            .await
            .map_err(|error| {
                error!("unable to fetch the session data from Redis: {error:?}");
                EnterRealmError::Internal
            })?
            .ok_or(EnterRealmError::Unauthorized)?;

        rmp_serde::from_slice::<UserSession>(&session_value)
            .map_err(|error| {
                // This can happen when we manually insert a key value pair into the session while
                // the user has not logged-in.
                warn!("expected properties are not present in the user session: {error:?}");

                EnterRealmError::Unauthorized
            })?
            .user_id
    };

    trace!("peer authenticated");

    let mut realm_guard = realm_map
        .async_lock(story_id, AsyncLimit::no_limit())
        .await
        // This should never throw
        .map_err(|error| {
            error!("unable to acquire a lock on the realm map: {error:?}");
            EnterRealmError::Internal
        })?;

    let mut txn = db_pool.begin().await.map_err(|error| {
        error!("unable begin a transaction: {error:?}");
        EnterRealmError::Internal
    })?;

    let story = sqlx::query(
        r#"
WITH contributor AS (
    SELECT role FROM story_contributors
    WHERE
        story_id = $1
        AND user_id = $2
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
),
blog_story AS (
    SELECT bs.blog_id
    FROM
        blog_stories AS bs
            INNER JOIN blogs AS b
                ON bs.blog_id = b.id
                -- Make sure the blog is active
                AND b.is_active IS TRUE
    WHERE
        bs.story_id = $1
        AND bs.deleted_at IS NULL
),
blog_owner AS (
    SELECT FROM blogs
    WHERE
        id = (SELECT blog_id FROM blog_story)
        AND user_id = $2
        AND deleted_at IS NULL
        AND EXISTS (SELECT FROM blog_story)
),
blog_editor AS (
    SELECT FROM blog_editors
    WHERE
        blog_id = (SELECT blog_id FROM blog_story)
        AND user_id = $2
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND EXISTS (SELECT FROM blog_story)
        AND NOT EXISTS (SELECT FROM blog_owner)
),
blog_member AS (
    SELECT COALESCE(
        (SELECT TRUE FROM blog_owner),
        (SELECT TRUE FROM blog_editor)
    ) AS "is_blog_member"
)
SELECT
    id,
    published_at,
    COALESCE(
        (SELECT role FROM contributor), 'editor'
    ) AS "role",
    (SELECT is_blog_member FROM blog_member) AS "is_blog_member"
FROM
	stories
WHERE
    id = $1
    AND deleted_at IS NULL
    AND (
        user_id = $2
        OR EXISTS(SELECT FROM contributor)
        OR (SELECT is_blog_member FROM blog_member) IS TRUE
    )
"#,
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            EnterRealmError::MissingStory
        } else {
            error!("database error: {error:?}");
            EnterRealmError::Internal
        }
    })?;

    // Resolve the peer role.
    let is_blog_member = story
        .get::<Option<bool>, _>("is_blog_member")
        .unwrap_or_default();
    let role = story.get::<String, _>("role");
    let role = if is_blog_member {
        PeerRole::Editor
    } else {
        PeerRole::from_str(role.as_str()).unwrap_or(PeerRole::Viewer)
    };

    if let Some(realm) = realm_guard.value() {
        txn.commit().await.map_err(|error| {
            error!("unable to commit the transaction: {error:?}");
            EnterRealmError::Internal
        })?;

        if !realm.can_join().await {
            return Err(EnterRealmError::Full);
        }

        debug!("[{story_id}] joining realm…");

        Ok((user_id, role, realm.clone()))
    } else {
        let doc_key = {
            if story
                .get::<Option<OffsetDateTime>, _>("published_at")
                .is_some()
            {
                // Fetch the editable document.
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
                .bind(story_id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|error| {
                    if matches!(error, sqlx::Error::RowNotFound) {
                        EnterRealmError::MissingStory
                    } else {
                        error!("database error: {error:?}");
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

                let final_doc_key = match final_doc_key {
                    Some(value) => value,
                    None => {
                        error!("unable to resolve the final document key");
                        return Err(EnterRealmError::Internal);
                    }
                };

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
                                .map_err(|error| {
                                    error!("unable to copy the original document: {error:?}");
                                    EnterRealmError::Internal
                                })?;
                        }
                        Err(error) => {
                            s3_client
                                .delete_object()
                                .bucket(S3_DOCS_BUCKET)
                                .key(inserted_doc_key.to_string())
                                .send()
                                .await
                                .map_err(|error| {
                                    error!(
                                        "unable to delete the orphaned document copy: {error:?}"
                                    );
                                    EnterRealmError::Internal
                                })?;

                            let service_error = error.into_service_error();

                            if !matches!(service_error, HeadObjectError::NotFound(_)) {
                                error!("unable to head the original document: {service_error:?}");
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
                .bind(story_id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|error| {
                    if matches!(error, sqlx::Error::RowNotFound) {
                        EnterRealmError::MissingStory
                    } else {
                        error!("database error: {error:?}");
                        EnterRealmError::Internal
                    }
                })?
                .get::<Uuid, _>("key")
            }
        };

        txn.commit().await.map_err(|error| {
            error!("unable to commit the transaction: {error:?}");
            EnterRealmError::Internal
        })?;

        let doc_body = fetch_doc_from_s3(&s3_client, &doc_key.to_string())
            .await
            .map_err(|error| {
                error!("unable to fetch the document from s3: {error:?}");
                EnterRealmError::Internal
            })?;

        debug!("[{story_id}] created realm");

        let doc = Doc::new();

        // The transaction is automatically committed at the end of this scope.
        if !doc_body.is_empty() {
            let mut txn = doc.transact_mut();
            let update = Update::decode_v2(&doc_body).map_err(|_| EnterRealmError::DocCorrupted)?;
            txn.apply_update(update);
        }

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bc_group = BroadcastGroup::new(awareness.clone(), BUFFER_CAP)
            .await
            .map_err(|error| {
                error!("unable to create a broadcast group: {error:?}");
                EnterRealmError::Internal
            })?;

        let realm = Arc::new(Realm::new(
            realm_map.clone(),
            s3_client.clone(),
            story_id,
            doc_key.to_string(),
            bc_group,
        ));

        realm_guard.insert(realm.clone());

        Ok((user_id, role, realm))
    }
}

/// Incoming realm peer handler.
#[allow(clippy::too_many_arguments)]
async fn peer_handler(
    ws: WebSocket,
    config: Arc<Config>,
    story_id: i64,
    session_cookie_value: Option<String>,
    realm_map: RealmMap,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
    s3_client: S3Client,
) {
    match enter_realm(
        config,
        story_id,
        session_cookie_value,
        realm_map,
        db_pool,
        redis_pool,
        s3_client,
    )
    .await
    {
        Ok((user_id, role, realm)) => {
            let peer_id = Uuid::new_v4();
            let (sink, stream) = ws.split();
            let sink = Arc::new(Mutex::new(RealmSink::from(sink)));
            let stream = RealmStream::from(stream);

            let _ = realm.subscribe(peer_id, user_id, role, sink, stream).await;
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
#[tracing::instrument(skip_all, err)]
pub async fn start_realms_server(
    realm_map: RealmMap,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
    s3_client: S3Client,
) -> std::io::Result<()> {
    #[allow(clippy::expect_used)]
    let config = Arc::new(get_app_config().expect("unable to load the environment configuration"));

    let host = config.realms_host.to_string();
    #[allow(clippy::expect_used)]
    let port = config
        .realms_port
        .clone()
        .parse::<u16>()
        .expect("unable to parse the port");

    #[allow(clippy::expect_used)]
    let socket_addr: SocketAddr = format!(
        "{}:{}",
        if config.is_dev { "127.0.0.1" } else { &host },
        &port
    )
    .parse()
    .expect("unable to parse the socket address");

    println!("Starting realms server at http://{}:{}", &host, &port);

    let realms_router = warp::get()
        .and(warp::path::end())
        .map(|| "Storiny realms server")
        // /health
        .or(warp::get().and(warp::path("health")).map(|| "OK"))
        // /doc_id
        .or(warp::get()
            .and(warp::any().map(move || config.clone()))
            .and(warp::path::param::<i64>())
            .and(warp::cookie::optional::<String>(SESSION_COOKIE_NAME))
            .and(warp::any().map(move || realm_map.clone()))
            .and(warp::any().map(move || db_pool.clone()))
            .and(warp::any().map(move || redis_pool.clone()))
            .and(warp::any().map(move || s3_client.clone()))
            .and(warp::ws())
            .and_then(
                |config,
                 story_id,
                 session_cookie_value,
                 realm_map,
                 db_pool,
                 redis_pool,
                 s3_client,
                 ws: Ws| async move {
                    Ok::<_, Rejection>(ws.on_upgrade(move |socket| {
                        peer_handler(
                            socket,
                            config,
                            story_id,
                            session_cookie_value,
                            realm_map,
                            db_pool,
                            redis_pool,
                            s3_client,
                        )
                    }))
                },
            ))
        .with({
            #[allow(clippy::expect_used)]
            let config = get_app_config().expect("unable to read the environment configuration");

            if config.is_dev {
                warp::cors().allow_any_origin()
            } else {
                let allowed_origin = config.web_server_url.to_string();
                warp::cors()
                    .allow_origin(&*allowed_origin)
                    .allow_methods(vec!["OPTIONS", "GET"])
            }
        })
        .with(warp::compression::gzip())
        .recover(handle_rejection);

    match signal(SignalKind::terminate()) {
        Ok(mut stream) => {
            let (_, server) =
                warp::serve(realms_router).bind_with_graceful_shutdown(socket_addr, async move {
                    stream.recv().await;
                });

            tokio::task::spawn(server);
        }
        Err(error) => {
            warn!("starting the realms server without graceful shutdown: {error:?}");

            let server = warp::serve(realms_router).bind(socket_addr);

            tokio::task::spawn(server);
        }
    };

    Ok(())
}

#[cfg(test)]
pub mod tests {
    use crate::{
        config::get_app_config,
        constants::{
            buckets::S3_DOCS_BUCKET,
            redis_namespaces::RedisNamespace,
            session_cookie::SESSION_COOKIE_NAME,
        },
        realms::{
            realm::{
                RealmMap,
                MAX_PEERS_PER_REALM,
            },
            server::{
                start_realms_server,
                EnterRealmError,
            },
        },
        test_utils::{
            count_s3_objects,
            get_redis_pool,
            get_s3_client,
            RedisTestContext,
            TestContext,
        },
        utils::{
            deflate_bytes_gzip::deflate_bytes_gzip,
            delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
            get_user_sessions::UserSession,
        },
        RedisPool,
        S3Client,
    };
    use cookie::{
        Cookie,
        CookieJar,
        Key,
    };
    use futures_util::{
        future,
        stream::{
            SplitSink,
            SplitStream,
        },
        SinkExt,
        StreamExt,
    };
    use lockable::{
        AsyncLimit,
        LockableHashMap,
    };
    use redis::AsyncCommands;
    use sqlx::{
        PgPool,
        Row,
    };
    use std::sync::Arc;
    use storiny_macros::test_context;
    use tokio::net::TcpStream;
    use tokio_tungstenite::{
        tungstenite::{
            client::IntoClientRequest,
            handshake::client::Request,
            Message,
        },
        MaybeTlsStream,
        WebSocketStream,
    };
    use uuid::Uuid;
    use yrs::{
        Doc,
        ReadTxn,
        StateVector,
        Transact,
    };

    struct LocalTestContext {
        s3_client: S3Client,
        redis_pool: RedisPool,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client().await,
                redis_pool: get_redis_pool(),
            }
        }

        async fn teardown(self) {
            future::join(
                async {
                    let redis_pool = &self.redis_pool;
                    let mut conn = redis_pool.get().await.unwrap();
                    let _: String = redis::cmd("FLUSHDB")
                        .query_async(&mut conn)
                        .await
                        .expect("failed to FLUSHDB");
                },
                async {
                    delete_s3_objects_using_prefix(&self.s3_client, S3_DOCS_BUCKET, None, None)
                        .await
                        .unwrap()
                },
            )
            .await;
        }
    }

    /// Initializes and spawns a realms server for tests. This function is intentionally public for
    /// use in [crate::realms::realm].
    ///
    /// * `db_pool` - The Postgres connection pool.
    /// * `s3_client` - The S3 client instance.
    /// * `logged_in` - The logged in flag. If set to `true`, a valid authentication token will get
    ///   appended to the realm server endpoint.
    /// * `insert_story` - The boolean flag indicating whether to insert a story.
    pub async fn init_realms_server_for_test(
        db_pool: PgPool,
        s3_client: Option<S3Client>,
        logged_in: bool,
        insert_story: bool,
    ) -> (
        // Endpoint
        Request,
        RealmMap,
        // User ID
        i64,
        // Story ID
        i64,
    ) {
        let config = get_app_config().unwrap();
        let realm_map: RealmMap = Arc::new(LockableHashMap::new());
        let redis_pool = get_redis_pool();
        let user_id = 1_i64;
        let story_id = 2_i64;

        start_realms_server(
            realm_map.clone(),
            db_pool.clone(),
            redis_pool.clone(),
            s3_client.unwrap_or(get_s3_client().await),
        )
        .await
        .expect("unable to start the server");

        // Insert a story.
        if insert_story {
            sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, $2, $3, $4)
)
INSERT INTO stories (id, user_id)
VALUES ($5, $1)
"#,
            )
            .bind(user_id)
            .bind("Some user")
            .bind("some_user")
            .bind("someone@example.com")
            .bind(story_id)
            .execute(&db_pool)
            .await
            .expect("unable to insert the story");
        }

        let endpoint_url = url::Url::parse(&format!(
            "ws://{}:{}/{story_id}",
            &config.realms_host, &config.realms_port
        ))
        .unwrap();

        let mut endpoint = endpoint_url.into_client_request().unwrap();

        // Insert a session.
        if logged_in {
            let mut conn = redis_pool.get().await.unwrap();
            let session_key = format!("{}:{}", user_id, Uuid::new_v4());
            let secret_key = Key::from(config.session_secret_key.as_bytes());
            let cookie = Cookie::new(SESSION_COOKIE_NAME, session_key.clone());
            let mut jar = CookieJar::new();

            jar.signed_mut(&secret_key).add(cookie);

            let cookie = jar.delta().next().unwrap();

            let _: () = conn
                .set(
                    &format!("{}:{session_key}", RedisNamespace::Session),
                    &rmp_serde::to_vec_named(&UserSession {
                        user_id,
                        ..Default::default()
                    })
                    .unwrap(),
                )
                .await
                .unwrap();

            endpoint
                .headers_mut()
                .insert("Cookie", cookie.to_string().parse().unwrap());
        }

        (endpoint, realm_map, user_id, story_id)
    }

    /// Returns a peer client. This function is intentionally public for use in
    /// [crate::realms::realm].
    ///
    /// * `endpoint` - The realm server connection endpoint.
    pub async fn peer(
        endpoint: Request,
    ) -> (
        SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>,
        SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    ) {
        let (ws_stream, _) = tokio_tungstenite::connect_async(endpoint)
            .await
            .expect("failed to connect");

        ws_stream.split()
    }

    mod serial {
        use super::*;
        use crate::realms::realm::PeerRole;
        use std::time::Duration;
        use tokio::time::timeout;

        #[sqlx::test]
        async fn can_reject_unauthorized_peers(pool: PgPool) {
            let (endpoint, _, _, _) = init_realms_server_for_test(pool, None, false, false).await;
            let (mut tx, rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                rx.for_each(|message| async {
                    let message = message.unwrap();
                    assert!(message.is_close());
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::Unauthorized.to_string()
                    );
                })
                .await
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_authorized_peers(_ctx: &mut RedisTestContext, pool: PgPool) {
            let (endpoint, _, _, _) = init_realms_server_for_test(pool, None, true, false).await;
            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::MissingStory.to_string()
                    );
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_editors(_ctx: &mut RedisTestContext, pool: PgPool) {
            let mut conn = pool.acquire().await.unwrap();

            let (endpoint, realm_map, user_id, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;

            // Change the user of the story.
            let result = sqlx::query(
                r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Example user', 'example_user', 'example_user@storiny.com')
    RETURNING id
)
UPDATE stories
SET user_id = (
    SELECT id FROM new_user
)
WHERE id = $1
"#,
            )
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Insert a contributor with editor role.
            let result = sqlx::query(
                r#"
INSERT INTO story_contributors
    (user_id, story_id, role, accepted_at)
VALUES ($1, $2, 'editor', NOW())
"#,
            )
            .bind(user_id)
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            let (mut tx, _) = peer(endpoint).await;

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            // Realm should be present in the map.
            let realm = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();

            assert!(realm.value().is_some());

            // Peer should have the correct role.
            let realm = realm.value().unwrap();
            let role = realm.get_peer_role(user_id).await.expect("peer not found");

            assert_eq!(role, PeerRole::Editor);

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_viewers(_ctx: &mut RedisTestContext, pool: PgPool) {
            let mut conn = pool.acquire().await.unwrap();

            let (endpoint, realm_map, user_id, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;

            // Change the user of the story.
            let result = sqlx::query(
                r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Example user', 'example_user', 'example_user@storiny.com')
    RETURNING id
)
UPDATE stories
SET user_id = (
    SELECT id FROM new_user
)
WHERE id = $1
"#,
            )
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Insert a contributor with viewer role.
            let result = sqlx::query(
                r#"
INSERT INTO story_contributors
    (user_id, story_id, role, accepted_at)
VALUES ($1, $2, 'viewer', NOW())
"#,
            )
            .bind(user_id)
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            let (mut tx, _) = peer(endpoint).await;

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            // Realm should be present in the map.
            let realm = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();

            assert!(realm.value().is_some());

            // Peer should have the correct role.
            let realm = realm.value().unwrap();
            let role = realm.get_peer_role(user_id).await.expect("peer not found");

            assert_eq!(role, PeerRole::Viewer);

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_blog_owners(_ctx: &mut RedisTestContext, pool: PgPool) {
            let mut conn = pool.acquire().await.unwrap();

            let (endpoint, realm_map, user_id, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;

            // Change the user of the story.
            let result = sqlx::query(
                r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Example user', 'example_user', 'example_user@storiny.com')
    RETURNING id
)
UPDATE stories
SET user_id = (
    SELECT id FROM new_user
)
WHERE id = $1
RETURNING user_id
"#,
            )
            .bind(story_id)
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            let story_writer_id = result.get::<i64, _>("user_id");

            // Insert a blog.
            let result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(user_id)
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            let blog_id = result.get::<i64, _>("id");

            // Add the writer of the story as an editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
            )
            .bind(story_writer_id)
            .bind(blog_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Add the story to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
            )
            .bind(blog_id)
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            let (mut tx, _) = peer(endpoint).await;

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            // Realm should be present in the map.
            let realm = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();

            assert!(realm.value().is_some());

            // Peer should have the correct role.
            let realm = realm.value().unwrap();
            let role = realm.get_peer_role(user_id).await.expect("peer not found");

            assert_eq!(role, PeerRole::Editor);

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_blog_editors(_ctx: &mut RedisTestContext, pool: PgPool) {
            let mut conn = pool.acquire().await.unwrap();

            let (endpoint, realm_map, user_id, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;

            // Change the user of the story.
            let result = sqlx::query(
                r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Example user', 'example_user', 'example_user@storiny.com')
    RETURNING id
)
UPDATE stories
SET user_id = (
    SELECT id FROM new_user
)
WHERE id = $1
RETURNING user_id
"#,
            )
            .bind(story_id)
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            // Insert a blog.
            let result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(result.get::<i64, _>("user_id"))
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            let blog_id = result.get::<i64, _>("id");

            // Add the current user as an editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
            )
            .bind(user_id)
            .bind(blog_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Add the story to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
            )
            .bind(blog_id)
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            let (mut tx, _) = peer(endpoint).await;

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            // Realm should be present in the map.
            let realm = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();

            assert!(realm.value().is_some());

            // Peer should have the correct role.
            let realm = realm.value().unwrap();
            let role = realm.get_peer_role(user_id).await.expect("peer not found");

            assert_eq!(role, PeerRole::Editor);

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_blog_members_for_a_locked_blog(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            let mut conn = pool.acquire().await.unwrap();
            let (endpoint, _, user_id, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;

            // Change the user of the story.
            let result = sqlx::query(
                r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Example user', 'example_user', 'example_user@storiny.com')
    RETURNING id
)
UPDATE stories
SET user_id = (
    SELECT id FROM new_user
)
WHERE id = $1
RETURNING user_id
"#,
            )
            .bind(story_id)
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            let story_writer_id = result.get::<i64, _>("user_id");

            // Insert a blog.
            let result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(user_id)
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            let blog_id = result.get::<i64, _>("id");

            // Add the writer of the story as an editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
            )
            .bind(story_writer_id)
            .bind(blog_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Add the story to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
            )
            .bind(blog_id)
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Lock the blog.
            let result = sqlx::query(
                r#"
UPDATE blogs
SET is_active = FALSE
WHERE id = $1
"#,
            )
            .bind(blog_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::MissingStory.to_string()
                    );
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_pending_blog_editors(_ctx: &mut RedisTestContext, pool: PgPool) {
            let mut conn = pool.acquire().await.unwrap();

            let (endpoint, _, user_id, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;

            // Change the user of the story.
            let result = sqlx::query(
                r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Example user', 'example_user', 'example_user@storiny.com')
    RETURNING id
)
UPDATE stories
SET user_id = (
    SELECT id FROM new_user
)
WHERE id = $1
RETURNING user_id
"#,
            )
            .bind(story_id)
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            // Insert a blog.
            let result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(result.get::<i64, _>("user_id"))
            .fetch_one(&mut *conn)
            .await
            .unwrap();

            let blog_id = result.get::<i64, _>("id");

            // Add the current user as an editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(user_id)
            .bind(blog_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Add the story to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
            )
            .bind(blog_id)
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::MissingStory.to_string()
                    );
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_pending_contributors(_ctx: &mut RedisTestContext, pool: PgPool) {
            let mut conn = pool.acquire().await.unwrap();

            let (endpoint, _, user_id, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;

            // Change the user of the story.
            let result = sqlx::query(
                r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Example user', 'example_user', 'example_user@storiny.com')
    RETURNING id
)
UPDATE stories
SET user_id = (
    SELECT id FROM new_user
)
WHERE id = $1
"#,
            )
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            // Insert a contributor.
            let result = sqlx::query(
                r#"
INSERT INTO story_contributors
    (user_id, story_id)
VALUES ($1, $2)
"#,
            )
            .bind(user_id)
            .bind(story_id)
            .execute(&mut *conn)
            .await
            .unwrap();

            assert_eq!(result.rows_affected(), 1);

            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::MissingStory.to_string()
                    );
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_peer_for_a_missing_story(_ctx: &mut RedisTestContext, pool: PgPool) {
            let (endpoint, _, _, _) = init_realms_server_for_test(pool, None, true, false).await;
            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::MissingStory.to_string()
                    );
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_peer_when_the_realm_is_full(_ctx: &mut RedisTestContext, pool: PgPool) {
            let (endpoint, _, _, _) = init_realms_server_for_test(pool, None, true, true).await;
            let mut peers = vec![];

            for _ in 0..MAX_PEERS_PER_REALM {
                // The `peers` array is used here because this peer will disconnect when it goes out
                // of this scope.
                peers.push(peer(endpoint.clone()).await);
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(15), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(message.to_string(), EnterRealmError::Full.to_string());
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_peer_for_a_soft_deleted_story(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;

            // Insert a soft-deleted story.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, $2, $3, $4)
)
INSERT INTO stories (id, user_id, deleted_at)
VALUES ($5, $1, NOW())
"#,
            )
            .bind(1_i64)
            .bind("Some user")
            .bind("some_user")
            .bind("someone@example.com")
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let (endpoint, _, _, _) = init_realms_server_for_test(pool, None, true, false).await;
            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::MissingStory.to_string()
                    );
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_create_a_realm_for_a_draft(_ctx: &mut RedisTestContext, pool: PgPool) {
            let (endpoint, realm_map, _, story_id) =
                init_realms_server_for_test(pool, None, true, true).await;
            let (mut tx, _) = peer(endpoint).await;

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            // Realm should be present in the map.
            let realm = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();

            assert!(realm.value().is_some());

            tx.close().await.unwrap();
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_create_a_realm_for_a_published_story(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;
            let mut conn = pool.acquire().await?;

            // Insert a published story.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, $2, $3, $4)
)
INSERT INTO stories (id, user_id, published_at)
VALUES ($5, $1, NOW())
"#,
            )
            .bind(1_i64)
            .bind("Some user")
            .bind("some_user")
            .bind("someone@example.com")
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Attach the document to object storage.
            let document = sqlx::query(
                r#"
SELECT key FROM documents
WHERE
    story_id = $1
    AND is_editable IS FALSE
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            let doc_body = Doc::new()
                .transact()
                .encode_state_as_update_v2(&StateVector::default());
            let data = deflate_bytes_gzip(&doc_body, None).await.unwrap();

            s3_client
                .put_object()
                .bucket(S3_DOCS_BUCKET)
                .key(document.get::<Uuid, _>("key").to_string())
                .body(data.into())
                .send()
                .await
                .unwrap();

            let documents = count_s3_objects(s3_client, S3_DOCS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(documents, 1_u32);

            let (endpoint, realm_map, _, story_id) =
                init_realms_server_for_test(pool, Some(s3_client.clone()), true, false).await;
            let (mut tx, _) = peer(endpoint).await;

            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            // Realm should be present in the map.
            let realm = realm_map
                .async_lock(story_id, AsyncLimit::no_limit())
                .await
                .unwrap();

            assert!(realm.value().is_some());

            // Should insert an editable document.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM documents
    WHERE 
        story_id = $1
        AND is_editable IS TRUE
)
"#,
            )
            .bind(story_id)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also make a copy of the original document in the object storage.
            let documents = count_s3_objects(s3_client, S3_DOCS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(documents, 2_u32);

            tx.close().await.unwrap();

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_reject_a_corrupted_document(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;
            let mut conn = pool.acquire().await?;

            // Insert a story.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, $2, $3, $4)
)
INSERT INTO stories (id, user_id)
VALUES ($5, $1)
"#,
            )
            .bind(1_i64)
            .bind("Some user")
            .bind("some_user")
            .bind("someone@example.com")
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Attach the document to object storage with invalid data.
            let document = sqlx::query(
                r#"
SELECT key FROM documents
WHERE
    story_id = $1
    AND is_editable IS FALSE
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            let data = deflate_bytes_gzip("bad data".as_bytes(), None)
                .await
                .unwrap();

            s3_client
                .put_object()
                .bucket(S3_DOCS_BUCKET)
                .key(document.get::<Uuid, _>("key").to_string())
                .body(data.into())
                .send()
                .await
                .unwrap();

            let documents = count_s3_objects(s3_client, S3_DOCS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(documents, 1_u32);

            let (endpoint, _, _, _) =
                init_realms_server_for_test(pool, Some(s3_client.clone()), true, false).await;
            let (mut tx, mut rx) = peer(endpoint).await;

            timeout(Duration::from_secs(10), async {
                if let Ok(message) = rx.next().await.unwrap() {
                    assert_eq!(
                        message.to_string(),
                        EnterRealmError::DocCorrupted.to_string()
                    );
                }
            })
            .await
            .expect("no message received");

            tx.close().await.unwrap();

            Ok(())
        }
    }
}
