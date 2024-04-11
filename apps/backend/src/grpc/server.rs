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
use std::{
    io,
    time::Duration,
};
use tonic::{
    codec::CompressionEncoding,
    codegen::InterceptedService,
    metadata::{
        Ascii,
        MetadataValue,
    },
    Request,
    Status,
};

/// Authentication middleware.
///
/// * `auth_token` - The authentication token on the server.
/// * `req` - The service request.
fn check_auth(auth_token: MetadataValue<Ascii>, req: Request<()>) -> Result<Request<()>, Status> {
    match req.metadata().get("authorization") {
        Some(meta_token) if auth_token == meta_token => Ok(req),
        _ => Err(Status::unauthenticated("missing_client_auth_token")),
    }
}

/// Initializes and starts the GRPC server.
///
/// * `config` - The environment configuration.
/// * `db_pool` - The Postgres connection pool.
/// * `redis_pool` - The Redis connection pool.
#[tracing::instrument(skip_all, ret, err)]
pub async fn start_grpc_server(
    config: Config,
    db_pool: Pool<Postgres>,
    redis_pool: RedisPool,
) -> io::Result<()> {
    let endpoint = config.grpc_endpoint.clone();
    let secret_token = config.grpc_secret_token.clone();
    let is_dev = config.is_dev;

    tokio::spawn(async move {
        let (mut health_reporter, health_service) = tonic_health::server::health_reporter();
        health_reporter
            .set_serving::<ApiServiceServer<GrpcService>>()
            .await;

        println!(
            "Starting GRPC server at {endpoint} in {} mode",
            if is_dev { "development" } else { "production" }
        );

        // FUTURE: Should we add a rate limit layer?
        let layer = tower::ServiceBuilder::new()
            .timeout(Duration::from_secs(30))
            .into_inner();

        let builder = if is_dev {
            tonic::transport::Server::builder()
                .layer(layer)
                .add_service(
                    ApiServiceServer::new(GrpcService {
                        redis_pool,
                        config,
                        db_pool,
                    })
                    .send_compressed(CompressionEncoding::Gzip)
                    .accept_compressed(CompressionEncoding::Gzip),
                )
        } else {
            let api_service = InterceptedService::new(
                ApiServiceServer::new(GrpcService {
                    redis_pool,
                    config,
                    db_pool,
                })
                .accept_compressed(CompressionEncoding::Gzip)
                .send_compressed(CompressionEncoding::Gzip),
                move |req: Request<()>| {
                    let auth_token: MetadataValue<_> = match format!("Bearer {secret_token}")
                        .parse()
                    {
                        Ok(value) => value,
                        Err(_) => return Err(Status::unauthenticated("missing_client_auth_token")),
                    };

                    check_auth(auth_token, req)
                },
            );

            // We do not need TLS here as the traffic inside the VPC is already encrypted.
            tonic::transport::Server::builder()
                .layer(layer)
                .add_service(api_service)
        };

        #[allow(clippy::expect_used)]
        builder
            .add_service(
                health_service
                    .send_compressed(CompressionEncoding::Gzip)
                    .accept_compressed(CompressionEncoding::Gzip),
            )
            .serve(endpoint.parse().expect("unable to parse the endpoint"))
            .await
            .expect("unable to start the grpc server");
    });

    Ok(())
}
