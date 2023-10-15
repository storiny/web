use super::{
    interface::{
        LoadError,
        SaveError,
        SessionState,
        UpdateError,
    },
    session_key::SessionKey,
    utils::generate_session_key,
};
use actix_web::cookie::time::Duration;
use anyhow::{
    Context,
    Error,
};
use redis::{
    aio::ConnectionManager,
    AsyncCommands,
    AsyncIter,
    Cmd,
    FromRedisValue,
    RedisResult,
    Value,
};
use std::{
    convert::TryInto,
    sync::Arc,
};

/// A builder to construct a [`RedisSessionStore`] instance with custom configuration
/// parameters.
pub struct RedisSessionStoreBuilder {
    connection_string: String,
    configuration: CacheConfiguration,
}

impl RedisSessionStoreBuilder {
    /// Finalise the builder and return a [`RedisActorSessionStore`] instance.
    pub async fn build(self) -> Result<RedisSessionStore, anyhow::Error> {
        let client = ConnectionManager::new(redis::Client::open(self.connection_string)?).await?;
        Ok(RedisSessionStore {
            configuration: self.configuration,
            client,
        })
    }
}

/// Redis session storage backend.
#[derive(Clone)]
pub struct RedisSessionStore {
    configuration: CacheConfiguration,
    client: ConnectionManager,
}

#[derive(Clone)]
struct CacheConfiguration {
    cache_keygen: Arc<dyn Fn(&str) -> String + Send + Sync>,
}

impl RedisSessionStore {
    /// Creates a new instance of [`RedisSessionStore`].
    ///
    /// * `connection_string` - A connection string for Redis.
    pub async fn new<S: Into<String>>(connection_string: S) -> Result<RedisSessionStore, Error> {
        RedisSessionStoreBuilder {
            configuration: CacheConfiguration {
                cache_keygen: Arc::new(str::to_owned),
            },
            connection_string: connection_string.into(),
        }
        .build()
        .await
    }

    /// Scans all the keys to match the specified cache_key (s:user_id?:cache_key)
    ///
    /// * `cache_key` - The cache key suffix.
    async fn get_cache_key(&self, cache_key: &str) -> Option<String> {
        let mut client = self.client.clone();
        let iter_result: RedisResult<AsyncIter<String>> = client
            .scan_match(format!("s:*:{}", cache_key)) // Match pattern `s:user_id?:session_key`
            .await;

        match iter_result {
            Ok(mut iter) => iter.next_item().await,
            Err(_) => None,
        }
    }

    /// Loads the session state associated to a session key.
    ///
    /// * `session_key` - The session key.
    async fn load(&self, session_key: &SessionKey) -> Result<Option<SessionState>, LoadError> {
        let cache_key = (self.configuration.cache_keygen)(session_key.as_ref());
        let redis_key = self.get_cache_key(&cache_key).await.unwrap_or(cache_key);

        let value: Option<String> = self
            .execute_command(redis::cmd("GET").arg(&[&redis_key]))
            .await
            .map_err(Into::into)
            .map_err(LoadError::Other)?;

        match value {
            None => Ok(None),
            Some(value) => Ok(serde_json::from_str(&value)
                .map_err(Into::into)
                .map_err(LoadError::Deserialization)?),
        }
    }

    /// Persists the session state for a newly created session in the Redis backend.
    ///
    /// * `session_data` - The session data.
    /// * `ttl` - TTL duration.
    ///
    /// Returns the corresponding session key.
    async fn save(
        &self,
        session_state: SessionState,
        ttl: &Duration,
    ) -> Result<SessionKey, SaveError> {
        let body = serde_json::to_string(&session_state)
            .map_err(Into::into)
            .map_err(SaveError::Serialization)?;
        let session_key = generate_session_key();
        let user_id = session_state.get("user_id");

        // Cache key format: s:user_id?:session_key
        // This allows us to scan for all the sessions
        // for a user by its ID.
        let cache_key = format!(
            "s:{}:{}",
            if let Some(unwrapped_id) = user_id {
                serde_json::from_str::<&str>(unwrapped_id).unwrap_or_default()
            } else {
                ""
            },
            (self.configuration.cache_keygen)(session_key.as_ref())
        );

        self.execute_command(redis::cmd("SET").arg(&[
            &cache_key,
            &body,
            "NX", // NX: only set the key if it does not already exist
            "EX", // EX: set expiry
            &format!("{}", ttl.whole_seconds()),
        ]))
        .await
        .map_err(Into::into)
        .map_err(SaveError::Other)?;

        Ok(session_key)
    }

    /// Updates the session state associated to a pre-existing session key.
    ///
    /// * `session_key` - The session key.
    /// * `session_state` - Next session data.
    /// * `ttl` - TTL duration
    async fn update(
        &self,
        session_key: SessionKey,
        session_state: SessionState,
        ttl: &Duration,
    ) -> Result<SessionKey, UpdateError> {
        let body = serde_json::to_string(&session_state)
            .map_err(Into::into)
            .map_err(UpdateError::Serialization)?;

        let cache_key = (self.configuration.cache_keygen)(session_key.as_ref());
        let redis_key = self.get_cache_key(&cache_key).await.unwrap_or(cache_key);

        let value: Value = self
            .execute_command(redis::cmd("SET").arg(&[
                &redis_key,
                &body,
                "XX", // XX: Only set the key if it already exist.
                "EX", // EX: set expiry
                &format!("{}", ttl.whole_seconds()),
            ]))
            .await
            .map_err(Into::into)
            .map_err(UpdateError::Other)?;

        match value {
            Value::Nil => {
                // The SET operation was not performed because the XX condition was not verified.
                // This can happen if the session state expired between the load operation and the
                // update operation. Unlucky, to say the least. We fall back to the `save` routine
                // to ensure that the new key is unique.
                self.save(session_state, ttl)
                    .await
                    .map_err(|err| match err {
                        SaveError::Serialization(err) => UpdateError::Serialization(err),
                        SaveError::Other(err) => UpdateError::Other(err),
                    })
            }
            Value::Int(_) | Value::Okay | Value::Status(_) => Ok(session_key),
            other => Err(UpdateError::Other(anyhow::anyhow!(
                "Failed to update session state. {:?}",
                other
            ))),
        }
    }

    /// Updates the TTL of the session state associated to a pre-existing session key.
    ///
    /// * `session_key` - The session key
    /// * `ttl` - Next TTL duration
    async fn update_ttl(&self, session_key: &SessionKey, ttl: &Duration) -> Result<(), Error> {
        let cache_key = (self.configuration.cache_keygen)(session_key.as_ref());
        let redis_key = self.get_cache_key(&cache_key).await.unwrap_or(cache_key);

        self.client
            .clone()
            .expire(
                &redis_key,
                ttl.whole_seconds().try_into().context(
                    "Failed to convert the state TTL into the number of whole seconds remaining",
                )?,
            )
            .await?;
        Ok(())
    }

    /// Removes a session at the specified key from the Redis backend.
    ///
    /// * `session_key` - The session key.
    async fn delete(&self, session_key: &SessionKey) -> Result<(), Error> {
        let cache_key = (self.configuration.cache_keygen)(session_key.as_ref());
        let redis_key = self.get_cache_key(&cache_key).await.unwrap_or(cache_key);
        self.execute_command(redis::cmd("DEL").arg(&[&redis_key]))
            .await
            .map_err(Into::into)
            .map_err(UpdateError::Other)?;

        Ok(())
    }
}

// #[async_trait::async_trait(?Send)]
// impl SessionStore for RedisSessionStore {}

impl RedisSessionStore {
    /// Executes Redis commands and retries once in certain cases.
    ///
    /// `ConnectionManager` automatically reconnects when it encounters an error talking to Redis.
    /// The request that bumped into the error, though, fails.
    ///
    /// This is generally OK, but there is an unpleasant edge case: Redis client timeouts. The
    /// server is configured to drop connections that have been active longer than a pre-determined
    /// threshold. `redis-rs` does not proactively detect that the connection has been dropped - you
    /// only find out when you try to use it.
    ///
    /// This helper method catches this case (`.is_connection_dropped`) to execute a retry. The
    /// retry will be executed on a fresh connection, therefore it is likely to succeed (or fail for
    /// a different more meaningful reason).
    async fn execute_command<T: FromRedisValue>(&self, cmd: &mut Cmd) -> RedisResult<T> {
        let mut can_retry = true;

        loop {
            match cmd.query_async(&mut self.client.clone()).await {
                Ok(value) => return Ok(value),
                Err(err) => {
                    if can_retry && err.is_connection_dropped() {
                        tracing::debug!(
                            "Connection dropped while trying to talk to Redis. Retrying."
                        );

                        // Retry at most once
                        can_retry = false;

                        continue;
                    } else {
                        return Err(err);
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::middleware::session::{
        config::{
            CookieContentSecurity,
            PersistentSession,
            TtlExtensionPolicy,
        },
        middleware,
        Session,
        SessionExt,
        SessionMiddleware,
    };
    use actix_web::{
        cookie::{
            time,
            Key,
        },
        dev::{
            Service,
            ServiceResponse,
        },
        test,
        web,
        App,
        HttpResponse,
    };
    use redis::AsyncCommands;
    use serde::{
        Deserialize,
        Serialize,
    };
    use serde_json::json;
    use std::collections::HashMap;

    /// Returns a new Redis session store instance
    async fn redis_store() -> RedisSessionStore {
        RedisSessionStore::new("redis://127.0.0.1:7000")
            .await
            .unwrap()
    }

    #[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
    pub struct IndexResponse {
        user_id: Option<String>,
        counter: i32,
    }

    async fn index(session: Session) -> actix_web::Result<HttpResponse> {
        let user_id: Option<String> = session.get::<String>("user_id").unwrap();
        let counter: i32 = session
            .get::<i32>("counter")
            .unwrap_or(Some(0))
            .unwrap_or(0);

        Ok(HttpResponse::Ok().json(&IndexResponse { user_id, counter }))
    }

    async fn do_something(session: Session) -> actix_web::Result<HttpResponse> {
        let user_id: Option<String> = session.get::<String>("user_id").unwrap();
        let counter: i32 = session
            .get::<i32>("counter")
            .unwrap_or(Some(0))
            .map_or(1, |inner| inner + 1);
        session.insert("counter", counter)?;

        Ok(HttpResponse::Ok().json(&IndexResponse { user_id, counter }))
    }

    async fn count(session: Session) -> actix_web::Result<HttpResponse> {
        let user_id: Option<String> = session.get::<String>("user_id").unwrap();
        let counter: i32 = session.get::<i32>("counter").unwrap().unwrap();
        Ok(HttpResponse::Ok().json(&IndexResponse { user_id, counter }))
    }

    #[derive(Deserialize)]
    struct Identity {
        user_id: String,
    }

    async fn login(
        user_id: web::Json<Identity>,
        session: Session,
    ) -> actix_web::Result<HttpResponse> {
        let id = user_id.into_inner().user_id;
        session.insert("user_id", &id)?;
        session.renew();

        let counter: i32 = session
            .get::<i32>("counter")
            .unwrap_or(Some(0))
            .unwrap_or(0);

        Ok(HttpResponse::Ok().json(&IndexResponse {
            user_id: Some(id),
            counter,
        }))
    }

    async fn logout(session: Session) -> actix_web::Result<HttpResponse> {
        let id: Option<String> = session.get("user_id")?;

        let body = if let Some(id) = id {
            session.purge();
            format!("Logged out: {id}")
        } else {
            "Could not log out anonymous user".to_owned()
        };

        Ok(HttpResponse::Ok().body(body))
    }

    trait ServiceResponseExt {
        fn get_cookie(&self, cookie_name: &str) -> Option<actix_web::cookie::Cookie<'_>>;
    }

    impl ServiceResponseExt for ServiceResponse {
        fn get_cookie(&self, cookie_name: &str) -> Option<actix_web::cookie::Cookie<'_>> {
            self.response().cookies().find(|c| c.name() == cookie_name)
        }
    }

    #[actix_web::test]
    async fn test_basic_workflow() {
        let redis_store = redis_store().await;
        let app = test::init_service(
            App::new()
                .wrap(
                    SessionMiddleware::builder(redis_store.clone(), Key::generate())
                        .cookie_path("/test/".into())
                        .cookie_name("actix-test".into())
                        .cookie_domain("localhost".into())
                        .cookie_content_security(CookieContentSecurity::Signed)
                        .session_lifecycle(
                            PersistentSession::default().session_ttl(time::Duration::seconds(100)),
                        )
                        .build(),
                )
                .service(web::resource("/").to(|ses: Session| async move {
                    let _ = ses.insert("counter", 100);
                    "test"
                }))
                .service(web::resource("/test/").to(|ses: Session| async move {
                    let val: usize = ses.get("counter").unwrap().unwrap();
                    format!("counter: {val}")
                })),
        )
        .await;

        let request = test::TestRequest::get().to_request();
        let response = app.call(request).await.unwrap();
        let cookie = response.get_cookie("actix-test").unwrap().clone();
        assert_eq!(cookie.path().unwrap(), "/test/");

        let request = test::TestRequest::with_uri("/test/")
            .cookie(cookie)
            .to_request();
        let body = test::call_and_read_body(&app, request).await;
        assert_eq!(body, web::Bytes::from_static(b"counter: 100"));
    }

    #[actix_web::test]
    async fn test_expiration_is_refreshed_on_changes() {
        let redis_store = redis_store().await;
        let session_ttl = time::Duration::seconds(60);
        let app = test::init_service(
            App::new()
                .wrap(
                    SessionMiddleware::builder(redis_store.clone(), Key::generate())
                        .cookie_content_security(CookieContentSecurity::Signed)
                        .session_lifecycle(PersistentSession::default().session_ttl(session_ttl))
                        .build(),
                )
                .service(web::resource("/").to(|ses: Session| async move {
                    let _ = ses.insert("counter", 100);
                    "test"
                }))
                .service(web::resource("/test/").to(|| async move { "no-changes-in-session" })),
        )
        .await;

        let request = test::TestRequest::get().to_request();
        let response = app.call(request).await.unwrap();
        let cookie_1 = response.get_cookie("id").expect("Cookie is set");
        assert_eq!(cookie_1.max_age(), Some(session_ttl));

        let request = test::TestRequest::with_uri("/test/")
            .cookie(cookie_1.clone())
            .to_request();
        let response = app.call(request).await.unwrap();
        assert!(response.response().cookies().next().is_none());

        let request = test::TestRequest::get().cookie(cookie_1).to_request();
        let response = app.call(request).await.unwrap();
        let cookie_2 = response.get_cookie("id").expect("Cookie is set");
        assert_eq!(cookie_2.max_age(), Some(session_ttl));
    }

    #[actix_web::test]
    async fn test_guard() {
        let redis_store = redis_store().await;
        let srv = actix_test::start(move || {
            App::new()
                .wrap(
                    SessionMiddleware::builder(redis_store.clone(), Key::generate())
                        .cookie_name("test-session".into())
                        .cookie_content_security(CookieContentSecurity::Signed)
                        .session_lifecycle(
                            PersistentSession::default().session_ttl(time::Duration::days(7)),
                        )
                        .build(),
                )
                .wrap(actix_web::middleware::Logger::default())
                .service(web::resource("/").route(web::get().to(index)))
                .service(web::resource("/do_something").route(web::post().to(do_something)))
                .service(web::resource("/login").route(web::post().to(login)))
                .service(web::resource("/logout").route(web::post().to(logout)))
                .service(
                    web::scope("/protected")
                        .guard(actix_web::guard::fn_guard(|g| {
                            g.get_session().get::<String>("user_id").unwrap().is_some()
                        }))
                        .service(web::resource("/count").route(web::get().to(count))),
                )
        });

        // Step 1: GET without session info
        //   - response should have an unsuccessful status
        let req_1 = srv.get("/protected/count").send();
        let res_1 = req_1.await.unwrap();
        assert!(!res_1.status().is_success());

        // Step 2: POST to login
        //   - set-cookie actix-session will be in response  (session cookie #1)
        //   - updates session state: {"counter": 0, "user_id": "ferris"}
        let req_2 = srv.post("/login").send_json(&json!({"user_id": "ferris"}));
        let res_2 = req_2.await.unwrap();
        let cookie_1 = res_2
            .cookies()
            .unwrap()
            .clone()
            .into_iter()
            .find(|c| c.name() == "test-session")
            .unwrap();

        // Step 3: POST to do_something
        //   - adds new session state:  {"counter": 1, "user_id": "ferris" }
        //   - set-cookie actix-session should be in response (session cookie #2)
        //   - response should be: {"counter": 1, "user_id": None}
        let req_3 = srv.post("/do_something").cookie(cookie_1.clone()).send();
        let mut res_3 = req_3.await.unwrap();
        let result_3 = res_3.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_3,
            IndexResponse {
                user_id: Some("ferris".into()),
                counter: 1
            }
        );
        let cookie_2 = res_3
            .cookies()
            .unwrap()
            .clone()
            .into_iter()
            .find(|c| c.name() == "test-session")
            .unwrap();

        // Step 4: GET using a existing user id
        //   - response should be: {"counter": 3, "user_id": "ferris"}
        let req_4 = srv.get("/protected/count").cookie(cookie_2.clone()).send();
        let mut res_4 = req_4.await.unwrap();
        let result_4 = res_4.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_4,
            IndexResponse {
                user_id: Some("ferris".into()),
                counter: 1
            }
        );
    }

    #[actix_web::test]
    async fn test_complex_workflow() {
        let session_ttl = time::Duration::days(7);
        let redis_store = redis_store().await;
        let srv = actix_test::start(move || {
            App::new()
                .wrap(
                    SessionMiddleware::builder(redis_store.clone(), Key::generate())
                        .cookie_name("test-session".into())
                        .cookie_content_security(CookieContentSecurity::Signed)
                        .session_lifecycle(PersistentSession::default().session_ttl(session_ttl))
                        .build(),
                )
                .wrap(actix_web::middleware::Logger::default())
                .service(web::resource("/").route(web::get().to(index)))
                .service(web::resource("/do_something").route(web::post().to(do_something)))
                .service(web::resource("/login").route(web::post().to(login)))
                .service(web::resource("/logout").route(web::post().to(logout)))
        });

        // Step 1:  GET index
        //   - set-cookie actix-session should NOT be in response (session data is empty)
        //   - response should be: {"counter": 0, "user_id": None}
        let req_1a = srv.get("/").send();
        let mut res_1 = req_1a.await.unwrap();
        assert!(res_1.cookies().unwrap().is_empty());
        let result_1 = res_1.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_1,
            IndexResponse {
                user_id: None,
                counter: 0
            }
        );

        // Step 2: POST to do_something
        //   - adds new session state in redis:  {"counter": 1}
        //   - set-cookie actix-session should be in response (session cookie #1)
        //   - response should be: {"counter": 1, "user_id": None}
        let req_2 = srv.post("/do_something").send();
        let mut res_2 = req_2.await.unwrap();
        let result_2 = res_2.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_2,
            IndexResponse {
                user_id: None,
                counter: 1
            }
        );
        let cookie_1 = res_2
            .cookies()
            .unwrap()
            .clone()
            .into_iter()
            .find(|c| c.name() == "test-session")
            .unwrap();
        assert_eq!(cookie_1.max_age(), Some(session_ttl));

        // Step 3:  GET index, including session cookie #1 in request
        //   - set-cookie will *not* be in response
        //   - response should be: {"counter": 1, "user_id": None}
        let req_3 = srv.get("/").cookie(cookie_1.clone()).send();
        let mut res_3 = req_3.await.unwrap();
        assert!(res_3.cookies().unwrap().is_empty());
        let result_3 = res_3.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_3,
            IndexResponse {
                user_id: None,
                counter: 1
            }
        );

        // Step 4: POST again to do_something, including session cookie #1 in request
        //   - set-cookie will be in response (session cookie #2)
        //   - updates session state:  {"counter": 2}
        //   - response should be: {"counter": 2, "user_id": None}
        let req_4 = srv.post("/do_something").cookie(cookie_1.clone()).send();
        let mut res_4 = req_4.await.unwrap();
        let result_4 = res_4.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_4,
            IndexResponse {
                user_id: None,
                counter: 2
            }
        );
        let cookie_2 = res_4
            .cookies()
            .unwrap()
            .clone()
            .into_iter()
            .find(|c| c.name() == "test-session")
            .unwrap();
        assert_eq!(cookie_2.max_age(), cookie_1.max_age());

        // Step 5: POST to login, including session cookie #2 in request
        //   - set-cookie actix-session will be in response  (session cookie #3)
        //   - updates session state: {"counter": 2, "user_id": "ferris"}
        let req_5 = srv
            .post("/login")
            .cookie(cookie_2.clone())
            .send_json(&json!({"user_id": "ferris"}));
        let mut res_5 = req_5.await.unwrap();
        let cookie_3 = res_5
            .cookies()
            .unwrap()
            .clone()
            .into_iter()
            .find(|c| c.name() == "test-session")
            .unwrap();
        assert_ne!(cookie_2.value(), cookie_3.value());

        let result_5 = res_5.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_5,
            IndexResponse {
                user_id: Some("ferris".into()),
                counter: 2
            }
        );

        // Step 6: GET index, including session cookie #3 in request
        //   - response should be: {"counter": 2, "user_id": "ferris"}
        let req_6 = srv.get("/").cookie(cookie_3.clone()).send();
        let mut res_6 = req_6.await.unwrap();
        let result_6 = res_6.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_6,
            IndexResponse {
                user_id: Some("ferris".into()),
                counter: 2
            }
        );

        // Step 7: POST again to do_something, including session cookie #3 in request
        //   - updates session state: {"counter": 3, "user_id": "ferris"}
        //   - response should be: {"counter": 3, "user_id": "ferris"}
        let req_7 = srv.post("/do_something").cookie(cookie_3.clone()).send();
        let mut res_7 = req_7.await.unwrap();
        let result_7 = res_7.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_7,
            IndexResponse {
                user_id: Some("ferris".into()),
                counter: 3
            }
        );

        // Step 8: GET index, including session cookie #2 in request
        // No state should be found associated to this session.
        let req_8 = srv.get("/").cookie(cookie_2.clone()).send();
        let mut res_8 = req_8.await.unwrap();
        assert!(res_8.cookies().unwrap().is_empty());
        let result_8 = res_8.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_8,
            IndexResponse {
                user_id: None,
                counter: 0
            }
        );

        // Step 9: POST to logout, including session cookie #3
        //   - set-cookie actix-session will be in response with session cookie #3 invalidation
        //     logic
        let req_9 = srv.post("/logout").cookie(cookie_3.clone()).send();
        let res_9 = req_9.await.unwrap();
        let cookie_3 = res_9
            .cookies()
            .unwrap()
            .clone()
            .into_iter()
            .find(|c| c.name() == "test-session")
            .unwrap();
        assert_eq!(0, cookie_3.max_age().map(|t| t.whole_seconds()).unwrap());
        assert_eq!("/", cookie_3.path().unwrap());

        // Step 10: GET index, including session cookie #3 in request
        //   - set-cookie actix-session should NOT be in response if invalidation is supported
        //   - response should be: {"counter": 0, "user_id": None}
        let req_10 = srv.get("/").cookie(cookie_3.clone()).send();
        let mut res_10 = req_10.await.unwrap();
        assert!(res_10.cookies().unwrap().is_empty());
        let result_10 = res_10.json::<IndexResponse>().await.unwrap();
        assert_eq!(
            result_10,
            IndexResponse {
                user_id: None,
                counter: 0
            }
        );
    }

    #[actix_web::test]
    async fn loading_a_missing_session_returns_none() {
        let store = redis_store().await;
        let session_key = generate_session_key();
        assert!(store.load(&session_key).await.unwrap().is_none());
    }

    #[actix_web::test]
    async fn loading_an_invalid_session_state_returns_deserialization_error() {
        let store = redis_store().await;
        let session_key = generate_session_key();
        store
            .client
            .clone()
            .set::<_, _, ()>(
                format!("s::{}", session_key.as_ref()),
                "random-thing-which-is-not-json",
            )
            .await
            .unwrap();
        assert!(matches!(
            store.load(&session_key).await.unwrap_err(),
            LoadError::Deserialization(_),
        ));
    }

    #[actix_web::test]
    async fn updating_of_an_expired_state_is_handled_gracefully() {
        let store = redis_store().await;
        let session_key = generate_session_key();
        let initial_session_key = session_key.as_ref().to_owned();
        let updated_session_key = store
            .update(session_key, HashMap::new(), &Duration::seconds(1))
            .await
            .unwrap();
        assert_ne!(initial_session_key, updated_session_key.as_ref());
    }
}
