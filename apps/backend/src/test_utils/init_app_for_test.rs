use crate::{
    config::get_app_config,
    constants::{
        redis_namespaces::RedisNamespace,
        session_cookie::SESSION_COOKIE_NAME,
    },
    jobs::{
        email::templated_email::TemplatedEmailJob,
        notify::{
            story_add_by_tag::NotifyStoryAddByTagJob,
            story_add_by_user::NotifyStoryAddByUserJob,
        },
        storage::JobStorage,
    },
    middlewares::identity::{
        identity::Identity,
        middleware::IdentityMiddleware,
    },
    oauth::get_oauth_client_map,
    realms::realm::{
        RealmData,
        RealmMap,
    },
    test_utils::{
        get_redis_pool,
        get_s3_client,
    },
    AppState,
};
use actix_extended_session::{
    storage::RedisSessionStore,
    SessionMiddleware,
};
use actix_http::{
    HttpMessage,
    Request,
};
use actix_web::{
    cookie::{
        Cookie,
        Key,
        SameSite,
    },
    dev::{
        HttpServiceFactory,
        Service,
        ServiceResponse,
    },
    get,
    post,
    test,
    web,
    App,
    Error,
    HttpRequest,
    HttpResponse,
    Responder,
};
use lockable::LockableHashMap;
use rand::Rng;
use serde::Deserialize;
use sqlx::{
    PgPool,
    Row,
};
use std::sync::Arc;
use user_agent_parser::UserAgentParser;

#[derive(Deserialize)]
struct Fragments {
    user_id: i64,
}

// Private login route
#[post("/__login__/{user_id}")]
async fn post(req: HttpRequest, path: web::Path<Fragments>) -> impl Responder {
    let user_id = path.user_id;
    Identity::login(&req.extensions(), user_id).unwrap();
    HttpResponse::Ok().finish()
}

// An emty endpoint
#[get("/__empty__")]
pub async fn empty_service() -> impl Responder {
    HttpResponse::Ok().finish()
}

/// Initializes the server application for tests
///
/// * `service_factory` - Service factory
/// * `db_pool` - Postgres pool
/// * `logged_in` - Whether to create a session for the user.
/// * `skip_inserting_user` - Whether to skip inserting the user into the database when `logged_in`
///   is enabled.
/// * `user_id` - Optional user ID to use instead of generating a random ID.
pub async fn init_app_for_test(
    service_factory: impl HttpServiceFactory + 'static,
    db_pool: PgPool,
    logged_in: bool,
    skip_inserting_user: bool,
    user_id: Option<i64>,
) -> (
    impl Service<Request, Response = ServiceResponse, Error = Error>,
    Option<Cookie<'static>>,
    Option<i64>, // User ID
) {
    let config = get_app_config().expect("Unable to load environment configuration");
    let redis_connection_string = format!("redis://{}:{}", config.redis_host, config.redis_port);

    // Session
    let secret_key = Key::from(get_app_config().unwrap().session_secret_key.as_bytes());
    let redis_store = RedisSessionStore::builder(&redis_connection_string)
        .cache_keygen(|key| format!("{}:{}", RedisNamespace::Session.to_string(), key)) // Add prefix to session records
        .build()
        .await
        .unwrap();

    // Redis pool
    let redis_pool = get_redis_pool();

    // Background jobs
    let story_add_by_user_job_data = web::Data::new(
        JobStorage::<NotifyStoryAddByUserJob>::connect(redis_connection_string.to_string())
            .await
            .unwrap(),
    );
    let story_add_by_tag_job_data = web::Data::new(
        JobStorage::<NotifyStoryAddByTagJob>::connect(redis_connection_string.to_string())
            .await
            .unwrap(),
    );
    let templated_email_job_data = web::Data::new(
        JobStorage::<TemplatedEmailJob>::connect(redis_connection_string.to_string())
            .await
            .unwrap(),
    );

    // GeoIP service
    let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

    // User-agent parser
    let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
        .expect("Cannot build user-agent parser");

    // Realm map
    let realm_map: RealmMap = Arc::new(LockableHashMap::new());
    let realm_data: RealmData = web::Data::from(realm_map.clone());

    // Application state
    let app_state = web::Data::new(AppState {
        config,
        redis: redis_pool.clone(),
        db_pool: db_pool.clone(),
        geo_db,
        ua_parser,
        s3_client: get_s3_client().await,
        reqwest_client: reqwest::Client::builder()
            .user_agent("Storiny (https://storiny.com)")
            .build()
            .unwrap(),
        oauth_client_map: get_oauth_client_map(get_app_config().unwrap()),
    });

    let service = test::init_service(
        App::new()
            .wrap(IdentityMiddleware::default())
            .wrap(
                SessionMiddleware::builder(redis_store.clone(), secret_key.clone())
                    .session_ttl(time::Duration::weeks(1))
                    .cookie_name(SESSION_COOKIE_NAME.into())
                    .cookie_same_site(SameSite::None)
                    .cookie_domain(None)
                    .cookie_path("/".to_string())
                    .cookie_secure(true)
                    // Cookie is read from the client side and used as the auth token for the realms
                    // endpoint.
                    .cookie_http_only(false)
                    .build(),
            )
            .wrap(actix_web::middleware::NormalizePath::trim())
            // Realms
            .app_data(realm_data.clone())
            // Jobs
            .app_data(story_add_by_user_job_data.clone())
            .app_data(story_add_by_tag_job_data.clone())
            .app_data(templated_email_job_data.clone())
            // Application state
            .app_data(app_state.clone())
            .service(post)
            .service(service_factory),
    )
    .await;

    if logged_in {
        let mut rng = rand::thread_rng();
        let mut next_user_id: Option<i64> = Some(user_id.unwrap_or(rng.gen::<i64>()));

        if !skip_inserting_user {
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
            // This email value should not be changed as it is hard-coded in some tests.
            .bind("someone@example.com".to_string())
            .fetch_one(&db_pool)
            .await
            .unwrap();

            if user_id.is_none() {
                next_user_id = Some(result.get::<i64, _>("id"));
            }
        }

        // Log the user in
        let req = test::TestRequest::post()
            .uri(&format!("/__login__/{}", next_user_id.unwrap()))
            .to_request();
        let res = test::call_service(&service, req).await;
        let cookie = res
            .response()
            .cookies()
            .find(|cookie| cookie.name() == SESSION_COOKIE_NAME)
            .unwrap();

        return (service, Some(cookie.into_owned()), next_user_id);
    }

    (service, None, None)
}
