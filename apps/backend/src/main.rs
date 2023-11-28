use actix_cors::Cors;
use actix_extended_session::{
    storage::RedisSessionStore,
    SessionMiddleware,
};
use actix_extensible_rate_limit::{
    backend::SimpleInputFunctionBuilder,
    RateLimiter,
};
use actix_files as fs;
use actix_request_identifier::RequestIdentifier;
use actix_web::{
    cookie::{
        Key,
        SameSite,
    },
    http::{
        header,
        header::ContentType,
    },
    web,
    App,
    HttpResponse,
    HttpServer,
    Responder,
};
use actix_web_validator::{
    JsonConfig,
    PathConfig,
    QsQueryConfig,
};
use dotenv::dotenv;
use futures::future;
use hashbrown::HashMap;
use redis::aio::ConnectionManager;
use rusoto_s3::S3Client;
use rusoto_ses::SesClient;
use rusoto_signature::Region;
use sqlx::{
    postgres::PgPoolOptions,
    Pool,
    Postgres,
};
use std::{
    io,
    sync::Arc,
    time::Duration,
};
use storiny::{
    config::{
        get_app_config,
        Config,
    },
    constants::{
        redis_namespaces::RedisNamespace,
        session_cookie::SESSION_COOKIE_NAME,
    },
    error::FormErrorResponse,
    grpc::{
        defs::grpc_service::v1::api_service_server::ApiServiceServer,
        service::GrpcService,
    },
    jobs::{
        email::templated_email::TemplatedEmailJob,
        init::start_jobs,
        notify::{
            story_add_by_tag::NotifyStoryAddByTagJob,
            story_add_by_user::NotifyStoryAddByUserJob,
        },
        storage::JobStorage,
    },
    middlewares::identity::middleware::IdentityMiddleware,
    oauth::get_oauth_client_map,
    realms::{
        realm::{
            RealmData,
            RealmMap,
        },
        server::start_realms_server,
    },
    *,
};
use tokio::sync::Mutex;
use tonic::codegen::CompressionEncoding;
use user_agent_parser::UserAgentParser;

/// 404 response
async fn not_found() -> impl Responder {
    HttpResponse::NotFound()
        .content_type(ContentType::plaintext())
        .body("Not found")
}

/// Initializes and starts the GRPC service.
///
/// * `config` - The environment configuration.
/// * `db_pool` - The Postgres pool.
async fn start_grpc_server(config: Config, db_pool: Pool<Postgres>) -> io::Result<()> {
    let endpoint = config.grpc_endpoint.clone();
    let redis_pool = deadpool_redis::Config::from_url(format!(
        "redis://{}:{}",
        &config.redis_host, &config.redis_port
    ))
    .create_pool(Some(deadpool_redis::Runtime::Tokio1))
    .unwrap();

    tokio::spawn(async move {
        tonic::transport::Server::builder()
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

#[actix_web::main]
async fn main() -> io::Result<()> {
    dotenv().ok();

    match get_app_config() {
        Ok(config) => {
            env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

            let host = config.host.to_string();
            let port = config.port.clone().parse::<u16>().unwrap();
            let redis_connection_string =
                format!("redis://{}:{}", &config.redis_host, &config.redis_port);

            log::info!(
                "{}",
                format!("Starting API HTTP server at http://{}:{}", &host, &port)
            );

            // Rate-limit
            let redis_client = redis::Client::open(redis_connection_string.clone())
                .expect("Cannot build Redis client");
            let redis_connection_manager = ConnectionManager::new(redis_client)
                .await
                .expect("Cannot build Redis connection manager");
            let rate_limit_backend =
                middlewares::rate_limiter::RedisBackend::builder(redis_connection_manager.clone())
                    .key_prefix(Some(&format!("{}:", RedisNamespace::RateLimit.to_string()))) // Add prefix to avoid collisions with other servicse
                    .build();

            // Session
            let secret_key = Key::from(&config.session_secret_key.as_bytes());
            let redis_store = match RedisSessionStore::builder(&redis_connection_string.clone())
                .cache_keygen(|key| format!("{}:{}", RedisNamespace::Session.to_string(), key)) // Add prefix to session records
                .build()
                .await
            {
                Ok(store) => store,
                Err(err) => {
                    println!("Failed to create the session store: {:?}", err);
                    std::process::exit(1);
                }
            };

            // Postgres
            let db_pool = match PgPoolOptions::new()
                .max_connections(25)
                .connect(&config.database_url)
                .await
            {
                Ok(pool) => pool,
                Err(err) => {
                    println!("Failed to connect to Postgres: {:?}", err);
                    std::process::exit(1);
                }
            };

            // Redis pool
            let redis_pool = match deadpool_redis::Config::from_url(redis_connection_string)
                .create_pool(Some(deadpool_redis::Runtime::Tokio1))
            {
                Ok(pool) => pool,
                Err(err) => {
                    println!("Failed to create a Redis pool: {:?}", err);
                    std::process::exit(1);
                }
            };

            // AWS S3
            let s3_client = S3Client::new(if config.is_dev {
                Region::Custom {
                    name: "us-east-1".to_string(),
                    endpoint: config.minio_endpoint.to_string(),
                }
            } else {
                Region::UsEast1
            });

            // AWS SES
            let ses_client = SesClient::new(Region::UsEast1);

            // Init and start the background jobs
            let story_add_by_user_job_data = web::Data::new(
                JobStorage::<NotifyStoryAddByUserJob>::new(redis_connection_manager.clone()),
            );
            let story_add_by_tag_job_data = web::Data::new(
                JobStorage::<NotifyStoryAddByTagJob>::new(redis_connection_manager.clone()),
            );
            let templated_email_job_data = web::Data::new(JobStorage::<TemplatedEmailJob>::new(
                redis_connection_manager.clone(),
            ));

            start_jobs(
                redis_connection_manager,
                redis_pool.clone(),
                db_pool.clone(),
                ses_client,
                s3_client.clone(),
            )
            .await;

            // GeoIP service
            let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

            // User-agent parser
            let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
                .expect("Cannot build user-agent parser");

            // Shared application state
            let app_state = web::Data::new(AppState {
                config: get_app_config().unwrap(),
                redis: redis_pool.clone(),
                db_pool: db_pool.clone(),
                geo_db,
                ua_parser,
                s3_client: s3_client.clone(),
                reqwest_client: reqwest::Client::builder()
                    .user_agent("Storiny (https://storiny.com)")
                    .build()
                    .unwrap(),
                oauth_client_map: get_oauth_client_map(get_app_config().unwrap()),
            });

            // Realm map
            let realm_map: RealmMap = Arc::new(Mutex::new(HashMap::new()));
            let realm_data: RealmData = web::Data::from(realm_map.clone());

            // Start the GRPC server
            let grpc_future = start_grpc_server(config.clone(), db_pool.clone());

            // Start the realms server
            let realms_future = start_realms_server(realm_map, db_pool, s3_client);

            // Start the main HTTP server
            let http_future = HttpServer::new(move || {
                let input = SimpleInputFunctionBuilder::new(Duration::from_secs(5), 25) // 25 requests / 5s
                    .real_ip_key()
                    .build();

                // JSON validation error handler
                let json_config = JsonConfig::default().error_handler(|err, _| {
                    let json_error = match &err {
                        actix_web_validator::Error::Validate(error) => {
                            FormErrorResponse::from(error)
                        }
                        _ => FormErrorResponse::new(Vec::new()),
                    };

                    actix_web::error::InternalError::from_response(
                        err,
                        HttpResponse::Conflict().json(json_error),
                    )
                    .into()
                });

                // Query validation error handler
                let qs_query_config = QsQueryConfig::default().error_handler(|err, _| {
                    actix_web::error::InternalError::from_response(
                        err,
                        HttpResponse::Conflict().body("Invalid query parameters".to_string()),
                    )
                    .into()
                });

                // Path fragments validation error handler
                let path_config = PathConfig::default().error_handler(|err, _| {
                    actix_web::error::InternalError::from_response(
                        err,
                        HttpResponse::Conflict().body("Invalid path fragments".to_string()),
                    )
                    .into()
                });

                App::new()
                    .wrap(IdentityMiddleware::default())
                    .wrap(
                        SessionMiddleware::builder(redis_store.clone(), secret_key.clone())
                            .session_ttl(time::Duration::weeks(1))
                            .cookie_name(SESSION_COOKIE_NAME.into())
                            .cookie_same_site(SameSite::None)
                            .cookie_domain(if config.is_dev {
                                None
                            } else {
                                Some("storiny.com".into())
                            })
                            .cookie_path("/".to_string())
                            .cookie_secure(!config.is_dev)
                            .cookie_http_only(true)
                            .build(),
                    )
                    .wrap(
                        RateLimiter::builder(rate_limit_backend.clone(), input)
                            .add_headers()
                            .build(),
                    )
                    .wrap(if config.is_dev {
                        Cors::permissive()
                    } else {
                        Cors::default()
                            .allowed_origin(&config.web_server_url)
                            .allowed_headers(vec![
                                header::CONTENT_TYPE,
                                header::AUTHORIZATION,
                                header::ACCEPT,
                                header::COOKIE,
                                header::SET_COOKIE,
                            ])
                            .supports_credentials()
                            .max_age(3600)
                    })
                    .wrap(RequestIdentifier::with_uuid())
                    .wrap(
                        actix_web::middleware::Logger::new(
                            "%{x-request-id}o %a %t \"%r\" %s %b \"%{Referer}i\" %T",
                        )
                        .log_target("api"),
                    )
                    .wrap(actix_web::middleware::Compress::default())
                    .wrap(actix_web::middleware::NormalizePath::trim())
                    // Realms
                    .app_data(realm_data.clone())
                    // Jobs
                    .app_data(story_add_by_user_job_data.clone())
                    .app_data(story_add_by_tag_job_data.clone())
                    .app_data(templated_email_job_data.clone())
                    // Validation
                    .app_data(json_config)
                    .app_data(qs_query_config)
                    .app_data(path_config)
                    // Application state
                    .app_data(app_state.clone())
                    // Routes
                    .configure(routes::init::init_common_routes)
                    .configure(routes::init::init_oauth_routes)
                    .configure(routes::init::init_v1_routes)
                    .service(fs::Files::new("/", "./static"))
                    .default_service(web::route().to(not_found))
            })
            .bind((host, port))?
            .run();

            future::try_join3(grpc_future, http_future, realms_future)
                .await
                .unwrap();

            Ok(())
        }
        Err(error) => {
            eprintln!("Environment configuration error: {:#?}", error);
            Ok(())
        }
    }
}
