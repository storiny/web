use crate::grpc::service::GrpcService;
use crate::{
    config::Config,
    grpc::defs::grpc_service::{
        v1::api_service_client::ApiServiceClient, v1::api_service_server::ApiServiceServer,
    },
};
use futures_core;
use sqlx::PgPool;
use std::future::Future;
use std::sync::Arc;
use tempfile::NamedTempFile;
use tokio::net::{UnixListener, UnixStream};
use tokio_stream::wrappers::UnixListenerStream;
use tonic::transport::{Channel, Endpoint, Server, Uri};
use tower::service_fn;

pub async fn init_grpc_service_for_test(
    db_pool: PgPool,
) -> (impl Future<Output = ()>, ApiServiceClient<Channel>) {
    let socket = NamedTempFile::new().unwrap();
    let socket = Arc::new(socket.into_temp_path());
    std::fs::remove_file(&*socket).unwrap();

    let uds = UnixListener::bind(&*socket).unwrap();
    let stream = UnixListenerStream::new(uds);

    let serve_future = async {
        let result = Server::builder()
            .add_service(ApiServiceServer::new(GrpcService {
                config: envy::from_env::<Config>().unwrap(),
                db_pool,
            }))
            .serve_with_incoming(stream)
            .await;
        // Server must be running fine...
        assert!(result.is_ok());
    };

    let socket = Arc::clone(&socket);
    // Connect to the server over a Unix socket
    // The URL will be ignored.
    let channel = Endpoint::try_from("http://any.url")
        .unwrap()
        .connect_with_connector(service_fn(move |_: Uri| {
            let socket = Arc::clone(&socket);
            async move { UnixStream::connect(&*socket).await }
        }))
        .await
        .unwrap();

    let client = ApiServiceClient::new(channel);

    (serve_future, client)
}
