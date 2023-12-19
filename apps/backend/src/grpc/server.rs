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
    metadata::{
        Ascii,
        MetadataValue,
    },
    transport::{
        Identity,
        ServerTlsConfig,
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
            let cert = std::fs::read_to_string("certs/grpc-server.pem")
                .expect("cannot read `certs/grpc-server.pem`");
            let key = std::fs::read_to_string("certs/grpc-server.key")
                .expect("cannot read `certs/grpc-server.key`");

            // TODO: Add compression after https://github.com/hyperium/tonic/issues/1553 is resolved.
            let api_service = ApiServiceServer::with_interceptor(
                GrpcService {
                    redis_pool,
                    config,
                    db_pool,
                },
                move |req: Request<()>| {
                    let auth_token: MetadataValue<_> = format!("Bearer {secret_token}")
                        .parse()
                        .expect("unable to parse the auth token");

                    check_auth(auth_token, req)
                },
            );

            tonic::transport::Server::builder()
                .layer(layer)
                .tls_config(ServerTlsConfig::new().identity(Identity::from_pem(&cert, &key)))
                .expect("unable to apply the tls config")
                .add_service(api_service)
        };

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
