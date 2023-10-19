#[cfg(test)]
pub mod test_utils {
    use crate::{
        middleware::{
            identity::{
                identity::Identity,
                middleware::IdentityMiddleware,
            },
            session::{
                middleware::SessionMiddleware,
                storage::RedisSessionStore,
            },
        },
        AppState,
    };
    use actix_http::{
        HttpMessage,
        Request,
    };
    use actix_web::{
        cookie::{
            time::Duration,
            Cookie,
            Key,
            SameSite,
        },
        dev::{
            HttpServiceFactory,
            Service,
            ServiceResponse,
        },
        post,
        test,
        web,
        App,
        Error,
        HttpRequest,
        HttpResponse,
        HttpServer,
        Responder,
    };
    use rand::distributions::uniform::SampleBorrow;
    use reqwest::Client;
    use rusoto_mock::{
        MockCredentialsProvider,
        MockRequestDispatcher,
    };
    use rusoto_s3::S3Client;
    use rusoto_ses::SesClient;
    use rusoto_signature::Region;
    use sqlx::PgPool;
    use std::{
        cell::RefCell,
        env,
        net::TcpListener,
        rc::Rc,
        sync::Arc,
    };
    use user_agent_parser::UserAgentParser;

    // Private login route
    #[post("/__login__")]
    async fn post(req: HttpRequest) -> impl Responder {
        Identity::login(&req.extensions(), 1i64).unwrap();
        HttpResponse::Ok().finish()
    }

    /// Initializes the server application for tests
    ///
    /// * `service_factory` - Service factory
    /// * `db_pool` - Postgres pool
    /// * `logged_in` - Whether to create a session for the user.
    /// * `skip_inserting_user` - Whether to skip inserting the user into the database when
    ///   `logged_in` is enabled.
    pub async fn init_app_for_test(
        service_factory: impl HttpServiceFactory + 'static,
        db_pool: PgPool,
        logged_in: bool,
        skip_inserting_user: bool,
    ) -> (
        impl Service<Request, Response = ServiceResponse, Error = Error>,
        Option<Cookie<'static>>,
        Option<i64>, // User ID
    ) {
        let redis_host = env::var("REDIS_HOST").unwrap_or("localhost".to_string());
        let redis_port = env::var("REDIS_PORT").unwrap_or("7000".to_string());
        let redis_connection_string = format!("redis://{redis_host}:{redis_port}");
        let secret_key = Key::generate();
        let redis_store = RedisSessionStore::new(&redis_connection_string)
            .await
            .unwrap();

        // GeoIP service
        let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

        // User-agent parser
        let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
            .expect("Cannot build user-agent parser");

        let service = test::init_service(
            App::new()
                .wrap(IdentityMiddleware::default())
                .wrap(
                    SessionMiddleware::builder(redis_store.clone(), secret_key.clone())
                        .cookie_name("_storiny_sess".into())
                        .cookie_same_site(SameSite::None)
                        .cookie_domain("storiny.com".into())
                        .cookie_path("/".to_string())
                        .cookie_max_age(Duration::weeks(1))
                        .cookie_secure(true)
                        .cookie_http_only(true)
                        .build(),
                )
                .app_data(web::Data::new(AppState {
                    redis: None,
                    db_pool: db_pool.clone(),
                    geo_db,
                    ua_parser,
                    ses_client: SesClient::new_with(
                        MockRequestDispatcher::default(),
                        MockCredentialsProvider,
                        Region::UsEast1,
                    ),
                    s3_client: S3Client::new_with(
                        MockRequestDispatcher::default(),
                        MockCredentialsProvider,
                        Region::UsEast1,
                    ),
                }))
                .service(post)
                .service(service_factory),
        )
        .await;

        if logged_in {
            if !skip_inserting_user {
                // Insert the user
                sqlx::query(
                    r#"
                INSERT INTO users(id, name, username, email)
                VALUES ($1, $2, $3, $4)
                "#,
                )
                .bind(1i64)
                .bind("Some user".to_string())
                .bind("some_user".to_string())
                .bind("someone@example.com".to_string())
                .execute(&db_pool)
                .await
                .unwrap();
            }

            // Log the user in
            let req = test::TestRequest::post().uri("/__login__").to_request();
            let res = test::call_service(&service, req).await;
            let cookie = res
                .response()
                .cookies()
                .find(|cookie| cookie.name() == "_storiny_sess")
                .unwrap();

            return (service, Some(cookie.into_owned()), Some(1i64));
        }

        (service, None, None)
    }

    /// Initializes and spawns an HTTP server for tests using `reqwest`
    ///
    /// * `service_factory` - Service factory
    /// * `db_pool` - Postgres pool
    /// * `logged_in` - Whether to create a session for the user.
    /// * `skip_inserting_user` - Whether to skip inserting the user into the database when
    ///   `logged_in` is enabled.
    pub async fn init_web_server_for_test(
        service_factory: impl HttpServiceFactory,
        db_pool: PgPool,
        logged_in: bool,
        skip_inserting_user: bool,
    ) -> (Client, Box<dyn Fn(&str) -> String>) {
        let redis_host = env::var("REDIS_HOST").unwrap_or("localhost".to_string());
        let redis_port = env::var("REDIS_PORT").unwrap_or("7000".to_string());
        let redis_connection_string = format!("redis://{redis_host}:{redis_port}");
        let secret_key = Key::generate();
        let redis_store = RedisSessionStore::new(&redis_connection_string)
            .await
            .unwrap();

        // Random OS port
        let listener = TcpListener::bind("localhost:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let db_pool_clone = db_pool.clone();
        let server = HttpServer::new(move || {
            // GeoIP service
            let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

            // User-agent parser
            let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
                .expect("Cannot build user-agent parser");

            App::new()
                .wrap(IdentityMiddleware::default())
                .wrap(
                    SessionMiddleware::builder(redis_store.clone(), secret_key.clone())
                        .cookie_name("_storiny_sess".into())
                        .cookie_same_site(SameSite::None)
                        .cookie_domain("storiny.com".into())
                        .cookie_path("/".to_string())
                        .cookie_max_age(Duration::weeks(1))
                        .cookie_secure(true)
                        .cookie_http_only(true)
                        .build(),
                )
                .app_data(web::Data::new(AppState {
                    redis: None,
                    db_pool: db_pool.clone(),
                    geo_db,
                    ua_parser,
                    ses_client: SesClient::new_with(
                        MockRequestDispatcher::default(),
                        MockCredentialsProvider,
                        Region::UsEast1,
                    ),
                    s3_client: S3Client::new_with(
                        MockRequestDispatcher::default(),
                        MockCredentialsProvider,
                        Region::UsEast1,
                    ),
                }))
                .service(post)
                .service(service_factory)
        })
        .workers(1)
        .listen(listener)
        .unwrap()
        .run();

        // tokio::s::spawn(server);
        tokio::spawn(server);

        let client = reqwest::Client::builder()
            .cookie_store(true)
            .build()
            .unwrap();

        // URL generator for the server
        let generate_url =
            Box::new(move |path: &str| -> String { format!("http://localhost:{}{}", port, path) });

        if logged_in {
            if !skip_inserting_user {
                // Insert the user
                sqlx::query(
                    r#"
                INSERT INTO users(id, name, username, email)
                VALUES ($1, $2, $3, $4)
                "#,
                )
                .bind(1i64)
                .bind("Some user".to_string())
                .bind("some_user".to_string())
                .bind("someone@example.com".to_string())
                .execute(&db_pool_clone)
                .await
                .unwrap();
            }

            // Log the user in
            let _ = client.get(generate_url("/__login__")).send().await.unwrap();
            // let cookie = res
            //     .cookies()
            //     .find(|cookie| cookie.name() == "_storiny_sess")
            //     .unwrap();
            //
            // return (service, Some(cookie.into_owned()), Some(1i64));
        }

        (client, generate_url)
    }
}
