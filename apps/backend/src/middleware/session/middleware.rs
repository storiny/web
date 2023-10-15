use super::{
    config::{
        self,
        Configuration,
        CookieConfiguration,
        SessionMiddlewareBuilder,
    },
    session::{
        Session,
        SessionStatus,
    },
    session_key::SessionKey,
    storage::{
        LoadError,
        RedisSessionStore,
    },
};
use actix_utils::future::{
    ready,
    Ready,
};
use actix_web::{
    body::MessageBody,
    cookie::{
        Cookie,
        CookieJar,
        Key,
    },
    dev::{
        forward_ready,
        ResponseHead,
        Service,
        ServiceRequest,
        ServiceResponse,
        Transform,
    },
    http::header::{
        HeaderValue,
        SET_COOKIE,
    },
    HttpResponse,
};
use anyhow::Context;
use hashbrown::HashMap;
use std::{
    convert::TryInto,
    fmt,
    future::Future,
    pin::Pin,
    rc::Rc,
};

/// A middleware for session management.
///
/// [`SessionMiddleware`] takes care of a few jobs:
///
/// - Instructs the session storage backend (Redis) to create/update/delete/retrieve the state
///   attached to a session according to its status and the operations that have been performed
///   against it;
/// - Set/remove a cookie, on the client side, to enable a user to be consistently associated with
///   the same session across multiple HTTP requests.
#[derive(Clone)]
pub struct SessionMiddleware {
    storage_backend: Rc<RedisSessionStore>,
    configuration: Rc<Configuration>,
}

impl SessionMiddleware {
    /// A fluent API to configure [`SessionMiddleware`].
    ///
    /// * `store` - An instance of the session storage backend (Redis).
    /// * `key` - A secret key, to sign the contents of the client-side session cookie.
    pub fn builder(store: RedisSessionStore, key: Key) -> SessionMiddlewareBuilder {
        SessionMiddlewareBuilder::new(store, config::default_configuration(key))
    }

    /// Build from parts
    pub fn from_parts(store: RedisSessionStore, configuration: Configuration) -> Self {
        Self {
            storage_backend: Rc::new(store),
            configuration: Rc::new(configuration),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for SessionMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Transform = InnerSessionMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(InnerSessionMiddleware {
            service: Rc::new(service),
            configuration: Rc::clone(&self.configuration),
            storage_backend: Rc::clone(&self.storage_backend),
        }))
    }
}

/// Short-hand to create an `actix_web::Error` instance that will result in an `Internal Server
/// Error` response while preserving the error root cause (e.g. in logs).
fn e500<E: fmt::Debug + fmt::Display + 'static>(err: E) -> actix_web::Error {
    // We do not use `actix_web::error::ErrorInternalServerError` because we do not want to
    // leak internal implementation details to the caller.
    //
    // `actix_web::error::ErrorInternalServerError` includes the error Display representation
    // as body of the error responses, leading to messages like "There was an issue persisting
    // the session state" reaching API clients. We don't want that, we want opaque 500s.
    actix_web::error::InternalError::from_response(
        err,
        HttpResponse::InternalServerError().finish(),
    )
    .into()
}

#[non_exhaustive]
pub struct InnerSessionMiddleware<S> {
    service: Rc<S>,
    configuration: Rc<Configuration>,
    storage_backend: Rc<RedisSessionStore>,
}

impl<S, B> Service<ServiceRequest> for InnerSessionMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    forward_ready!(service);

    fn call(&self, mut req: ServiceRequest) -> Self::Future {
        let service = Rc::clone(&self.service);
        let storage_backend = Rc::clone(&self.storage_backend);
        let configuration = Rc::clone(&self.configuration);

        Box::pin(async move {
            let session_key = extract_session_key(&req, &configuration.cookie);
            let (session_key, session_state) =
                load_session_state(session_key, storage_backend.as_ref()).await?;

            Session::set_session(&mut req, session_state);

            let mut res = service.call(req).await?;
            let (status, session_state) = Session::get_changes(&mut res);

            match session_key {
                None => {
                    // We do not create an entry in the session store if there is no state
                    // attached to a fresh session
                    if !session_state.is_empty() {
                        let cookie_type = session_state.get("cookie_type");
                        let mut next_state = session_state.clone();
                        next_state.remove("cookie_type"); // Remove cookie type from session state

                        let session_key = storage_backend
                            .save(next_state, &configuration.session.state_ttl)
                            .await
                            .map_err(e500)?;

                        set_session_cookie(
                            res.response_mut().head_mut(),
                            session_key,
                            &configuration.cookie,
                            if let Some(cookie_type) = cookie_type {
                                serde_json::from_str::<String>(cookie_type).unwrap_or_default()
                                    == "persistent".to_string()
                            } else {
                                false
                            },
                        )
                        .map_err(e500)?;
                    }
                }
                Some(session_key) => {
                    match status {
                        SessionStatus::Renewed => {
                            storage_backend.delete(&session_key).await.map_err(e500)?;
                            let cookie_type = session_state.get("cookie_type");
                            let mut next_state = session_state.clone();
                            next_state.remove("cookie_type"); // Remove cookie type from session state

                            let session_key = storage_backend
                                .save(next_state, &configuration.session.state_ttl)
                                .await
                                .map_err(e500)?;

                            set_session_cookie(
                                res.response_mut().head_mut(),
                                session_key,
                                &configuration.cookie,
                                if let Some(cookie_type) = cookie_type {
                                    serde_json::from_str::<String>(cookie_type).unwrap_or_default()
                                        == "persistent".to_string()
                                } else {
                                    false
                                },
                            )
                            .map_err(e500)?;
                        }
                        SessionStatus::Changed => {
                            let cookie_type = session_state.get("cookie_type");
                            let mut next_state = session_state.clone();
                            next_state.remove("cookie_type"); // Remove cookie type from session state

                            let session_key = storage_backend
                                .update(session_key, next_state, &configuration.session.state_ttl)
                                .await
                                .map_err(e500)?;

                            set_session_cookie(
                                res.response_mut().head_mut(),
                                session_key,
                                &configuration.cookie,
                                if let Some(cookie_type) = cookie_type {
                                    serde_json::from_str::<String>(cookie_type).unwrap_or_default()
                                        == "persistent".to_string()
                                } else {
                                    false
                                },
                            )
                            .map_err(e500)?;
                        }
                        SessionStatus::Purged => {
                            storage_backend.delete(&session_key).await.map_err(e500)?;

                            delete_session_cookie(
                                res.response_mut().head_mut(),
                                &configuration.cookie,
                            )
                            .map_err(e500)?;
                        }
                        SessionStatus::PurgedAll => {
                            storage_backend
                                .delete_all(&session_key)
                                .await
                                .map_err(e500)?;
                        }
                        SessionStatus::Unchanged => {}
                    };
                }
            }

            Ok(res)
        })
    }
}

/// Examines the session cookie attached to the incoming request, if there is one, and tries
/// to extract the session key.
///
/// It returns `None` if there is no session cookie or if the session cookie is considered invalid
/// (e.g., when failing a signature check).
fn extract_session_key(req: &ServiceRequest, config: &CookieConfiguration) -> Option<SessionKey> {
    let cookies = req.cookies().ok()?;
    let session_cookie = cookies
        .iter()
        .find(|&cookie| cookie.name() == config.name)?;

    let mut jar = CookieJar::new();
    jar.add_original(session_cookie.clone());
    let verification_result = jar.signed(&config.key).get(&config.name);

    if verification_result.is_none() {
        tracing::warn!(
            "The session cookie attached to the incoming request failed to pass cryptographic \
            checks (signature verification/decryption)."
        );
    }

    match verification_result?.value().to_owned().try_into() {
        Ok(session_key) => Some(session_key),
        Err(err) => {
            tracing::warn!(
                error.message = %err,
                error.cause_chain = ?err,
                "Invalid session key, ignoring."
            );
            None
        }
    }
}

/// Loads session state from the storage backend (Redis).
///
/// * `session_key` - The session key.
/// * `storage_backend` - The Redis storage backend.
async fn load_session_state(
    session_key: Option<SessionKey>,
    storage_backend: &RedisSessionStore,
) -> Result<(Option<SessionKey>, HashMap<String, String>), actix_web::Error> {
    if let Some(session_key) = session_key {
        match storage_backend.load(&session_key).await {
            Ok(state) => {
                if let Some(state) = state {
                    Ok((Some(session_key), state))
                } else {
                    // We discard the existing session key given that the state attached to it can
                    // no longer be found (e.g. it expired or we suffered some data loss in the
                    // storage). Regenerating the session key will trigger the `save` workflow
                    // instead of the `update` workflow if the session state is modified during the
                    // lifecycle of the current request.

                    tracing::info!(
                        "No session state has been found for a valid session key, creating a new \
                        empty session."
                    );
                    Ok((None, HashMap::new()))
                }
            }

            Err(err) => match err {
                LoadError::Deserialization(err) => {
                    tracing::warn!(
                        error.message = %err,
                        error.cause_chain = ?err,
                        "Invalid session state, creating a new empty session."
                    );

                    Ok((Some(session_key), HashMap::new()))
                }

                LoadError::Other(err) => Err(e500(err)),
            },
        }
    } else {
        Ok((None, HashMap::new()))
    }
}

/// Appends the `Set-Cookie` header to the client response.
///
/// * `response` - Client response.
/// * `session_key` - The session key.
/// * `config` - Cookie configuration.
/// * `is_persistent` - Wether the cookie is persistent.
fn set_session_cookie(
    response: &mut ResponseHead,
    session_key: SessionKey,
    config: &CookieConfiguration,
    is_persistent: bool,
) -> Result<(), anyhow::Error> {
    let value: String = session_key.into();
    let mut cookie = Cookie::new(config.name.clone(), value);

    cookie.set_secure(config.secure);
    cookie.set_http_only(config.http_only);
    cookie.set_same_site(config.same_site);
    cookie.set_path(config.path.clone());

    if is_persistent {
        cookie.set_max_age(config.max_age);
    }

    cookie.set_domain(config.domain.clone());

    let mut jar = CookieJar::new();
    jar.signed_mut(&config.key).add(cookie);

    // Set the cookie
    let cookie = jar.delta().next().unwrap();
    let val = HeaderValue::from_str(&cookie.encoded().to_string())
        .context("Failed to attach a session cookie to the outgoing response")?;

    response.headers_mut().append(SET_COOKIE, val);

    Ok(())
}

/// Appends a session removal cookie to the response.
///
/// * `response` - Client response.
/// * `config` - Cookie configuration.
fn delete_session_cookie(
    response: &mut ResponseHead,
    config: &CookieConfiguration,
) -> Result<(), anyhow::Error> {
    let mut removal_cookie = Cookie::build(config.name.clone(), "")
        .path(config.path.clone())
        .secure(config.secure)
        .http_only(config.http_only)
        .same_site(config.same_site)
        .domain(config.domain.clone())
        .finish();

    removal_cookie.make_removal();

    let val = HeaderValue::from_str(&removal_cookie.to_string())
        .context("Failed to attach a session removal cookie to the outgoing response")?;
    response.headers_mut().append(SET_COOKIE, val);

    Ok(())
}
