use crate::{
    config::get_app_config,
    grpc::{
        defs::grpc_service::v1::{
            api_service_client::ApiServiceClient,
            api_service_server::ApiServiceServer,
        },
        service::GrpcService,
    },
    test_utils::get_redis_pool,
    RedisPool,
};
use sqlx::{
    PgPool,
    Row,
};
use std::{
    future::Future,
    sync::Arc,
};
use tempfile::NamedTempFile;
use tokio::net::{
    UnixListener,
    UnixStream,
};
use tokio_stream::wrappers::UnixListenerStream;
use tonic::transport::{
    Channel,
    Endpoint,
    Server,
    Uri,
};
use tower::service_fn;

/// Initializes the GRPC service and executes the body of test closure.
///
/// * `db_pool` - Postgres pool
/// * `insert_user` - Whether to insert a user to the database
/// * `test_closure` - A closure with the body containing the test code
#[allow(clippy::type_complexity)]
pub async fn test_grpc_service<B>(
    db_pool: PgPool,
    insert_user: bool,
    test_closure: Box<dyn Fn(ApiServiceClient<Channel>, PgPool, RedisPool, Option<i64>) -> B>,
) where
    B: Future<Output = ()>,
{
    let mut user_id: i64 = 1_i64;

    if insert_user {
        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (name, username, email)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Some user".to_string())
        .bind("some_user".to_string())
        .bind("someone@example.com".to_string())
        .fetch_one(&db_pool)
        .await
        .unwrap();

        user_id = result.get::<i64, _>("id");
    }

    let socket = Arc::new(NamedTempFile::new().unwrap().into_temp_path());
    std::fs::remove_file(&*socket).unwrap();

    let uds = UnixListener::bind(&*socket).unwrap();
    let stream = UnixListenerStream::new(uds);

    // Redis
    let redis_pool = get_redis_pool();
    let server_future = async {
        let result = Server::builder()
            .add_service(ApiServiceServer::new(GrpcService {
                config: get_app_config().unwrap(),
                redis_pool: redis_pool.clone(),
                db_pool: db_pool.clone(),
            }))
            .serve_with_incoming(stream)
            .await;

        // Server should be running
        assert!(result.is_ok());
    };

    // Connect to the server over a Unix socket.
    let socket = Arc::clone(&socket);

    // The URL will be ignored.
    let channel = Endpoint::try_from("http://test.com")
        .unwrap()
        .connect_with_connector(service_fn(move |_: Uri| {
            let socket = Arc::clone(&socket);
            async move { UnixStream::connect(&*socket).await }
        }))
        .await
        .unwrap();

    // Build a client instance.
    let client = ApiServiceClient::new(channel);

    // Execute the test closure.
    let request_future = test_closure(
        client,
        db_pool.clone(),
        redis_pool.clone(),
        if insert_user { Some(user_id) } else { None },
    );

    tokio::select! {
        _ = server_future => panic!("Server returned first"),
        _ = request_future => (),
    }
}
