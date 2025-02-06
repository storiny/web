use actix_cors::Cors;
use actix_extensible_rate_limit::{
    RateLimiter,
    backend::SimpleInputFunctionBuilder,
};
use actix_web::{
    App,
    HttpResponse,
    HttpServer,
    Responder,
    cookie::{
        Key,
        SameSite,
    },
    http::header::ContentType,
    web,
};
use actix_web_validator::{
    JsonConfig,
    PathConfig,
    QsQueryConfig,
};
use dotenv::dotenv;
use futures::future;
use lockable::LockableHashMap;
use redis::aio::ConnectionManager;
use sqlx::postgres::PgPoolOptions;
use std::{
    io,
    sync::Arc,
    time::Duration,
};
use storiny::{
    amqp::init::init_mq_consumers,
    config::get_app_config,
    constants::{
        redis_namespaces::RedisNamespace,
        session_cookie::SESSION_COOKIE_NAME,
    },
    cron::init::start_cron_jobs,
    error::FormErrorResponse,
    grpc::server::start_grpc_server,
    middlewares::identity::middleware::IdentityMiddleware,
    oauth::get_oauth_client_map,
    realms::{
        realm::{
            RealmData,
            RealmMap,
        },
        server::start_realms_server,
    },
    telemetry::{
        get_subscriber,
        init_subscriber,
    },
    *,
};
use storiny_session::{
    SessionMiddleware,
    storage::RedisSessionStore,
};
use tracing::error;
use tracing_actix_web::TracingLogger;
use tracing_subscriber::{
    layer::SubscriberExt,
    util::SubscriberInitExt,
};
use user_agent_parser::UserAgentParser;

const GEOLITE_CITY: &[u8] = include_bytes!("../geo/db/GeoLite2-City.mmdb");
const UA_PARSER_DATA: &str = include_str!("../data/ua_parser/regexes.yaml");

/// 404 response
async fn not_found() -> impl Responder {
    HttpResponse::NotFound()
        .content_type(ContentType::plaintext())
        .body("Not found")
}

fn main() -> io::Result<()> {
    dotenv().ok();

    match get_app_config() {
        Ok(config) => {
            if config.is_dev {
                let subscriber = get_subscriber("dev".to_string(), "info".to_string(), io::stdout);
                init_subscriber(subscriber);
            } else {
                tracing_subscriber::Registry::default()
                    .with(sentry::integrations::tracing::layer())
                    .init();
            }

            let _guard = sentry::init((
                "https://8d4ce60586c45bd6d5aff53c90feda6a@o4506393718554624.ingest.sentry.io/4506393874989056",
                sentry::ClientOptions {
                    release: sentry::release_name!(),
                    traces_sample_rate: 0.8,
                    before_send: Some(Arc::new(|event| {
                        if let Some(ref message) = event.message {
                            if
                            // Do not send client error response.
                            message.starts_with("ClientError") ||
                            // Do not send toast error response.
                            message.starts_with("ToastError") ||
                            // Do not send form error response.
                            message.starts_with("FormError") ||
                            // Do not send `NotFound` response inside a GRPC service.
                            message.starts_with("status: NotFound") ||
                            // Do not send external auth client error.
                            message.starts_with("VerifyPassword") ||
                            message.starts_with("InvalidPassword")
                            {
                                return None;
                            }
                        }

                        Some(event)
                    })),
                    ..Default::default()
                },
            ));

            actix_web::rt::System::new().block_on(async {
                let host = config.host.to_string();
                let port = config.port.clone().parse::<u16>().unwrap();
                let redis_connection_string =
                    format!("redis://{}:{}", &config.redis_host, &config.redis_port);

                println!(
                    "Starting API HTTP server in {} mode at {}:{}",
                    if config.is_dev {
                        "development"
                    } else {
                        "production"
                    },
                    &host,
                    &port
                );

                // Rate-limit
                let redis_client = redis::Client::open(redis_connection_string.clone())
                    .expect("Cannot build Redis client");
                let redis_connection_manager = match ConnectionManager::new(redis_client).await {
                    Ok(manager) => {
                        println!("Connected to Redis");
                        manager
                    }
                    Err(error) => {
                        error!("Unable to connect to Redis: {error:?}");
                        std::process::exit(1);
                    }
                };

                let rate_limit_backend = middlewares::rate_limiter::RedisBackend::builder(
                    redis_connection_manager.clone(),
                )
                .key_prefix(Some(&format!("{}:", RedisNamespace::RateLimit))) // Add prefix to avoid collisions with other servicse
                .build();

                // Session
                let secret_key = Key::from(config.session_secret_key.as_bytes());
                let redis_store = match RedisSessionStore::builder(&redis_connection_string.clone())
                    .cache_keygen(|key| format!("{}:{}", RedisNamespace::Session, key)) // Add prefix to session records
                    .build()
                    .await
                {
                    Ok(store) => store,
                    Err(err) => {
                        error!("Failed to create the session store: {:?}", err);
                        std::process::exit(1);
                    }
                };

                // Postgres
                let db_pool = match PgPoolOptions::new()
                    .max_connections(30)
                    .min_connections(1)
                    .idle_timeout(Some(Duration::from_secs(120)))
                    .connect(&config.database_url)
                    .await
                {
                    Ok(pool) => {
                        println!("Connected to Postgres");

                        // Run migrations.
                        match sqlx::migrate!("./migrations").run(&pool).await {
                            Ok(_) => {
                                println!("Successfully ran database migrations");
                            }
                            Err(err) => {
                                error!("failed to run database migrations: {:?}", err);
                                std::process::exit(1);
                            }
                        }

                        pool
                    }
                    Err(err) => {
                        error!("failed to connect to Postgres: {:?}", err);
                        std::process::exit(1);
                    }
                };

                // Redis pool
                let redis_pool = match deadpool_redis::Config::from_url(redis_connection_string)
                    .create_pool(Some(deadpool_redis::Runtime::Tokio1))
                {
                    Ok(pool) => {
                        println!("Created Redis pool");
                        pool
                    }
                    Err(err) => {
                        error!("failed to create a Redis pool: {:?}", err);
                        std::process::exit(1);
                    }
                };

                // Lapin pool
                let lapin_pool = {
                    match (deadpool_lapin::Config {
                        url: Some(config.amqp_server_url.to_string()),
                        ..Default::default()
                    })
                    .create_pool(Some(deadpool_lapin::Runtime::Tokio1))
                    {
                        Ok(pool) => {
                            println!("Created AMQP pool");
                            pool
                        }
                        Err(err) => {
                            error!("failed to create an AMQP pool: {:?}", err);
                            std::process::exit(1);
                        }
                    }
                };

                // AWS configuration
                let shared_aws_config = aws_config::defaults(get_aws_behavior_version())
                    .region(get_aws_region())
                    .load()
                    .await;

                // AWS S3
                let s3_client = {
                    S3Client::from_conf(if config.is_dev {
                        let config_builder = aws_sdk_s3::config::Builder::from(&shared_aws_config);

                        config_builder
                            .endpoint_url(config.minio_endpoint.to_string())
                            // Minio requires `force_path_style` set to `true`.
                            .force_path_style(true)
                            .build()
                    } else {
                        aws_sdk_s3::config::Builder::from(&shared_aws_config).build()
                    })
                };

                // Init the message queues.
                if let Err(err) = init_mq_consumers(
                    lapin_pool.clone(),
                    redis_pool.clone(),
                    db_pool.clone(),
                    SesClient::new(&shared_aws_config),
                    s3_client.clone(),
                )
                .await
                {
                    error!("failed start the AMQP consumers: {:?}", err);
                    std::process::exit(1);
                }

                // Start background cron jobs.
                start_cron_jobs(db_pool.clone(), s3_client.clone());

                // GeoIP service. This is kept in the memory for the entire lifecycle of the program
                // to ensure fast loopups.
                let geo_db = maxminddb::Reader::from_source(GEOLITE_CITY.to_vec()).unwrap();

                // User-agent parser
                let ua_parser = UserAgentParser::from_str(UA_PARSER_DATA)
                    .expect("Cannot build user-agent parser");

                // Shared application state
                let app_state = web::Data::new(AppState {
                    config: get_app_config().unwrap(),
                    redis: redis_pool.clone(),
                    lapin: lapin_pool.clone(),
                    db_pool: db_pool.clone(),
                    geo_db,
                    ua_parser,
                    s3_client: s3_client.clone(),
                    reqwest_client: reqwest::Client::builder()
                        .user_agent("Storiny (https://storiny.com)")
                        .build()
                        .unwrap(),
                    oauth_client: reqwest::Client::builder()
                        .user_agent("Storiny OAuth (https://storiny.com)")
                        .redirect(reqwest::redirect::Policy::none())
                        .build()
                        .unwrap(),
                    oauth_client_map: get_oauth_client_map(get_app_config().unwrap()),
                });

                // Realm map
                let realm_map: RealmMap = Arc::new(LockableHashMap::new());
                let realm_data: RealmData = web::Data::from(realm_map.clone());

                // Start the GRPC server
                let grpc_future =
                    start_grpc_server(config.clone(), db_pool.clone(), redis_pool.clone());

                // Start the realms server
                let realms_future = start_realms_server(realm_map, db_pool, redis_pool, s3_client);

                // Start the main HTTP server.
                let http_future = HttpServer::new(move || {
                    let input = SimpleInputFunctionBuilder::new(Duration::from_secs(5), 25) // 25 requests / 5s
                        .real_ip_key()
                        .build();

                    // JSON validation error handler.
                    let json_config = JsonConfig::default().error_handler(|error, _| {
                        let response = match &error {
                            actix_web_validator::Error::Validate(errors) => {
                                HttpResponse::Conflict().json(FormErrorResponse::from(errors))
                            }
                            _ => HttpResponse::BadRequest().body("Invalid or missing form data"),
                        };

                        actix_web::error::InternalError::from_response(error, response).into()
                    });

                    // Query validation error handler.
                    let qs_query_config = QsQueryConfig::default().error_handler(|error, _| {
                        actix_web::error::InternalError::from_response(
                            error,
                            HttpResponse::Conflict().body("Invalid query parameters".to_string()),
                        )
                        .into()
                    });

                    // Path fragments validation error handler.
                    let path_config = PathConfig::default().error_handler(|error, _| {
                        actix_web::error::InternalError::from_response(
                            error,
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
                                    Some(".storiny.com".into())
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
                                .allow_any_origin()
                                .allow_any_header()
                                .allow_any_method()
                                .supports_credentials()
                                .max_age(3600)
                        })
                        .wrap(
                            actix_web::middleware::DefaultHeaders::new()
                                .add(("x-storiny-api-version", "1")),
                        )
                        .wrap(TracingLogger::default())
                        .wrap(actix_web::middleware::Compress::default())
                        .wrap(actix_web::middleware::NormalizePath::trim())
                        // Realms
                        .app_data(realm_data.clone())
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
                        .default_service(web::route().to(not_found))
                })
                .bind((host, port))?
                .run();

                future::try_join3(grpc_future, http_future, realms_future)
                    .await
                    .unwrap();

                Ok(())
            })
        }
        Err(error) => {
            eprintln!("Environment configuration error: {:#?}", error);
            Ok(())
        }
    }
}
