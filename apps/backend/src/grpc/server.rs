use crate::{
    config::Config,
    grpc::{
        defs::grpc_service::v1::api_service_server::ApiServiceServer,
        service::GrpcService,
    },
    RedisPool,
};
use sqlx::{
    Pool,
    Postgres,
};
use std::io;
use tonic::codec::CompressionEncoding;

/// Initializes and starts the GRPC server.
///
/// * `config` - The environment configuration.
/// * `db_pool` - The Postgres connection pool.
/// * `redis_pool` - The Redis connection pool.
pub async fn start_grpc_server(
    config: Config,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
) -> io::Result<()> {
    let endpoint = config.grpc_endpoint.clone();

    tokio::spawn(async move {
        let (mut health_reporter, health_service) = tonic_health::server::health_reporter();
        health_reporter
            .set_serving::<ApiServiceServer<GrpcService>>()
            .await;

        tonic::transport::Server::builder()
            .add_service(health_service)
            .add_service(
                ApiServiceServer::new(GrpcService {
                    redis_pool,
                    config,
                    db_pool,
                })
                .send_compressed(CompressionEncoding::Gzip)
                .accept_compressed(CompressionEncoding::Gzip),
            )
            .serve(endpoint.parse().unwrap())
            .await
            .unwrap();
    });

    Ok(())
}
