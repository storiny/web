use crate::config::SessionLifecycle;
use actix_utils::future::{
    ready,
    Ready,
};
use actix_web::{
    body::BoxBody,
    dev::{
        Extensions,
        Payload,
        ServiceRequest,
        ServiceResponse,
    },
    error::Error,
    FromRequest,
    HttpMessage,
    HttpRequest,
    HttpResponse,
    ResponseError,
};
use anyhow::Context;
use derive_more::{
    Display,
    From,
};
use serde::de::DeserializeOwned;
use serde_json::{
    Map,
    Value,
};
use std::{
    cell::{
        Ref,
        RefCell,
    },
    error::Error as StdError,
    mem,
    rc::Rc,
};

/// The primary interface to access and modify session state.
///
/// [`Session`] is an [extractor](#impl-FromRequest)—you can specify it as an input type for your
/// request handlers and it will be automatically extracted from the incoming request.
///
/// ```
/// use serde_json::Value;
/// use storiny_session::Session;
///
/// async fn index(session: Session) -> actix_web::Result<&'static str> {
///     // access session data
///     if let Some(count) = session.get::<i32>("counter")? {
///         session.insert("counter", Value::from(count + 1));
///     } else {
///         session.insert("counter", Value::from(1));
///     }
///
///     Ok("Welcome!")
/// }
/// # actix_web::web::to(index);
/// ```
///
/// You can also retrieve a [`Session`] object from an `HttpRequest` or a `ServiceRequest` using
/// [`SessionExt`].
///
/// [`SessionExt`]: crate::SessionExt
#[derive(Clone)]
pub struct Session(Rc<RefCell<SessionInner>>);

/// Status of a [`Session`].
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum SessionStatus {
    /// Session state has been updated - the changes will have to be persisted to the backend.
    Changed,

    /// The session has been flagged for deletion - the session cookie will be removed from
    /// the client and the session state will be deleted from the session store.
    ///
    /// Most operations on the session after it has been marked for deletion will have no effect.
    Purged,

    /// The session has been flagged for renewal.
    ///
    /// The session key will be regenerated and the time-to-live of the session state will be
    /// extended.
    Renewed,

    /// The session state has not been modified since its creation/retrieval.
    #[default]
    Unchanged,
}

#[derive(Default)]
struct SessionInner {
    state: Map<String, Value>,
    status: SessionStatus,
    lifecycle: SessionLifecycle,
}

impl Session {
    /// Get a `value` from the session.
    ///
    /// It returns an error if it fails to parse as `T` the JSON value associated with `key`.
    pub fn get<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>, SessionGetError> {
        if let Some(value) = self.0.borrow().state.get(key) {
            Ok(Some(
                serde_json::from_value::<T>(value.clone())
                    .with_context(|| {
                        format!(
                            "Failed to deserialize the JSON-encoded session data attached to key \
                            `{}` as a `{}` type",
                            key,
                            std::any::type_name::<T>()
                        )
                    })
                    .map_err(SessionGetError)?,
            ))
        } else {
            Ok(None)
        }
    }

    /// Get all raw key-value data from the session.
    ///
    /// Note that values are JSON encoded.
    pub fn entries(&self) -> Ref<'_, Map<String, Value>> {
        Ref::map(self.0.borrow(), |inner| &inner.state)
    }

    /// Returns session status.
    pub fn status(&self) -> SessionStatus {
        Ref::map(self.0.borrow(), |inner| &inner.status).clone()
    }

    /// Inserts a key-value pair into the session.
    pub fn insert(&self, key: impl Into<String>, value: Value) {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            if inner.status != SessionStatus::Renewed {
                inner.status = SessionStatus::Changed;
            }

            inner.state.insert(key.into(), value);
        }
    }

    /// Remove value from the session.
    ///
    /// If present, the JSON encoded value is returned.
    pub fn remove(&self, key: &str) -> Option<Value> {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            if inner.status != SessionStatus::Renewed {
                inner.status = SessionStatus::Changed;
            }
            return inner.state.remove(key);
        }

        None
    }

    /// Clear the session.
    pub fn clear(&self) {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            if inner.status != SessionStatus::Renewed {
                inner.status = SessionStatus::Changed;
            }
            inner.state.clear()
        }
    }

    /// Removes session both client and server side.
    pub fn purge(&self) {
        let mut inner = self.0.borrow_mut();
        inner.status = SessionStatus::Purged;
        inner.state.clear();
    }

    /// Renews the session key, assigning existing session state to new key.
    pub fn renew(&self) {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            inner.status = SessionStatus::Renewed;
        }
    }

    /// Sets the lifecycle of the session cookie.
    pub fn set_lifecycle(&self, next_lifecycle: SessionLifecycle) {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            if inner.status != SessionStatus::Renewed {
                inner.status = SessionStatus::Changed;
            }

            inner.lifecycle = next_lifecycle;
        }
    }

    /// Returns the lifecycle of the session cookie.
    pub fn get_lifecycle(&self) -> SessionLifecycle {
        let inner = self.0.borrow_mut();
        inner.lifecycle.to_owned()
    }

    /// Adds the given key-value pairs to the session on the request.
    ///
    /// Values that match keys already existing on the session will be overwritten.
    #[allow(clippy::needless_pass_by_ref_mut)]
    pub(crate) fn set_session(
        req: &mut ServiceRequest,
        data: impl IntoIterator<Item = (String, Value)>,
        lifecycle: SessionLifecycle,
    ) {
        let session = Session::get_session(&mut req.extensions_mut());
        let mut inner = session.0.borrow_mut();
        inner.state.extend(data);
        inner.lifecycle = lifecycle;
    }

    /// Returns session lifecycle, session status, and iterator of key-value pairs of changes.
    ///
    /// This is a destructive operation - the session state is removed from the request extensions
    /// type-map, leaving behind a new empty map. It should only be used when the session is being
    /// finalised (i.e. in `SessionMiddleware`).
    #[allow(clippy::needless_pass_by_ref_mut)]
    pub(crate) fn get_changes<B>(
        res: &mut ServiceResponse<B>,
    ) -> (SessionLifecycle, SessionStatus, Map<String, Value>) {
        if let Some(s_impl) = res
            .request()
            .extensions()
            .get::<Rc<RefCell<SessionInner>>>()
        {
            let state = mem::take(&mut s_impl.borrow_mut().state);
            (
                s_impl.borrow().lifecycle.clone(),
                s_impl.borrow().status.clone(),
                state,
            )
        } else {
            (
                SessionLifecycle::PersistentSession,
                SessionStatus::Unchanged,
                Map::new(),
            )
        }
    }

    pub(crate) fn get_session(extensions: &mut Extensions) -> Session {
        if let Some(s_impl) = extensions.get::<Rc<RefCell<SessionInner>>>() {
            return Session(Rc::clone(s_impl));
        }

        let inner = Rc::new(RefCell::new(SessionInner::default()));
        extensions.insert(inner.clone());

        Session(inner)
    }
}

/// Extractor implementation for [`Session`]s.
///
/// # Examples
/// ```
/// # use actix_web::*;
/// use serde_json::Value;
/// use storiny_session::Session;
///
/// #[get("/")]
/// async fn index(session: Session) -> Result<impl Responder> {
///     // access session data
///     if let Some(count) = session.get::<i32>("counter")? {
///         session.insert("counter", Value::from(count + 1));
///     } else {
///         session.insert("counter", Value::from(1));
///     }
///
///     let count = session.get::<i32>("counter")?.unwrap();
///     Ok(format!("Counter: {}", count))
/// }
/// ```
impl FromRequest for Session {
    type Error = Error;
    type Future = Ready<Result<Session, Error>>;

    #[inline]
    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        ready(Ok(Session::get_session(&mut req.extensions_mut())))
    }
}

/// Error returned by [`Session::get`].
#[derive(Debug, Display, From)]
#[display(fmt = "{_0}")]
pub struct SessionGetError(anyhow::Error);

impl StdError for SessionGetError {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        Some(self.0.as_ref())
    }
}

impl ResponseError for SessionGetError {
    fn error_response(&self) -> HttpResponse<BoxBody> {
        HttpResponse::new(self.status_code())
    }
}
