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
use hashbrown::HashMap;
use serde::{
    de::DeserializeOwned,
    Serialize,
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
#[derive(Clone)]
pub struct Session(Rc<RefCell<SessionInner>>);

/// Status of a [`Session`].
#[derive(Debug, Clone, Default, PartialEq, Eq)]
#[warn(dead_code)]
pub enum SessionStatus {
    /// Session state has been updated - the changes will have to be persisted to the Redis
    /// backend.
    Changed,
    /// The session has been flagged for deletion - the session cookie will be removed from
    /// the client and the session state will be deleted from the Redis session store.
    ///
    /// Most operations on the session after it has been marked for deletion will have no effect.
    Purged,
    /// The sessions has been flagged for deletion, based on the user_id stored in the Redis
    /// backend. All the sessions will be removed expect the current one.
    PurgedAll,
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
    state: HashMap<String, String>,
    status: SessionStatus,
}

#[allow(dead_code)]
impl Session {
    /// Returns a value from the session.
    ///
    /// * `key` - Map key.
    pub fn get<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>, SessionGetError> {
        if let Some(val_str) = self.0.borrow().state.get(key) {
            Ok(Some(
                serde_json::from_str(val_str)
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

    /// Returns session status.
    pub fn status(&self) -> SessionStatus {
        Ref::map(self.0.borrow(), |inner| &inner.status).clone()
    }

    /// Returns all raw key-value data from the session.
    ///
    /// Note that values are JSON encoded.
    pub fn entries(&self) -> Ref<'_, HashMap<String, String>> {
        Ref::map(self.0.borrow(), |inner| &inner.state)
    }

    /// Inserts a key-value pair into the session.
    ///
    /// Any serializable value can be used and will be encoded as JSON in session data, hence why
    /// only a reference to the value is taken.
    ///
    /// * `key` - The map key to insert the value at.
    /// * `value` - The value to insert.
    pub fn insert<T: Serialize>(
        &self,
        key: impl Into<String>,
        value: T,
    ) -> Result<(), SessionInsertError> {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            if inner.status != SessionStatus::Renewed {
                inner.status = SessionStatus::Changed;
            }

            let key = key.into();
            let val = serde_json::to_string(&value)
                .with_context(|| {
                    format!(
                        "Failed to serialize the provided `{}` type instance as JSON in order to \
                        attach as session data to the `{}` key",
                        std::any::type_name::<T>(),
                        &key
                    )
                })
                .map_err(SessionInsertError)?;

            inner.state.insert(key, val);
        }

        Ok(())
    }

    /// Removes value at the provided key from the session.
    ///
    /// If present, the JSON encoded value is returned.
    ///
    /// * `key` - The key of the record to remove.
    pub fn remove(&self, key: &str) -> Option<String> {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            if inner.status != SessionStatus::Renewed {
                inner.status = SessionStatus::Changed;
            }
            return inner.state.remove(key);
        }

        None
    }

    /// Removes the session from both client and server side.
    pub fn purge(&self) {
        let mut inner = self.0.borrow_mut();
        inner.status = SessionStatus::Purged;
        inner.state.clear();
    }

    /// Removes all the sessions except the current one from the Redis backend.
    pub fn purge_all(&self) {
        let mut inner = self.0.borrow_mut();
        inner.status = SessionStatus::PurgedAll;
        inner.state.clear();
    }

    /// Renews the session key, assigning existing session state to new
    /// key.
    pub fn renew(&self) {
        let mut inner = self.0.borrow_mut();
        if inner.status != SessionStatus::Purged {
            inner.status = SessionStatus::Renewed;
        }
    }

    /// Clears the session.
    pub fn clear(&self) {
        let mut inner = self.0.borrow_mut();

        if inner.status != SessionStatus::Purged {
            if inner.status != SessionStatus::Renewed {
                inner.status = SessionStatus::Changed;
            }
            inner.state.clear()
        }
    }

    /// Adds the given key-value pairs to the session on the request.
    ///
    /// Values that match keys already existing on the session will be overwritten. Values should
    /// already be JSON serialized.
    ///
    /// * `req` - Service request.
    /// * `data` - Key-value pairs to insert.
    pub fn set_session(req: &mut ServiceRequest, data: impl IntoIterator<Item = (String, String)>) {
        let session = Session::get_session(&mut req.extensions_mut());
        let mut inner = session.0.borrow_mut();
        inner.state.extend(data);
    }

    /// Returns session status and iterator of key-value pairs of changes.
    ///
    /// This is a destructive operation - the session state is removed from the request extensions
    /// typemap, leaving behind a new empty map. It should only be used when the session is being
    /// finalised (i.e. in `SessionMiddleware`).
    ///
    /// * `res` - Service response.
    pub fn get_changes<B>(
        res: &mut ServiceResponse<B>,
    ) -> (SessionStatus, HashMap<String, String>) {
        if let Some(s_impl) = res
            .request()
            .extensions()
            .get::<Rc<RefCell<SessionInner>>>()
        {
            let state = mem::take(&mut s_impl.borrow_mut().state);
            (s_impl.borrow().status.clone(), state)
        } else {
            (SessionStatus::Unchanged, HashMap::new())
        }
    }

    /// Returns the session from the extensions.
    ///
    /// * `extensions` - Extensions.
    pub fn get_session(extensions: &mut Extensions) -> Session {
        if let Some(s_impl) = extensions.get::<Rc<RefCell<SessionInner>>>() {
            return Session(Rc::clone(s_impl));
        }

        let inner = Rc::new(RefCell::new(SessionInner::default()));
        extensions.insert(inner.clone());

        Session(inner)
    }
}

/// Extractor implementation for [`Session`]s.
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

/// Error returned by [`Session::insert`].
#[derive(Debug, Display, From)]
#[display(fmt = "{_0}")]
pub struct SessionInsertError(anyhow::Error);

impl StdError for SessionInsertError {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        Some(self.0.as_ref())
    }
}

impl ResponseError for SessionInsertError {
    fn error_response(&self) -> HttpResponse<BoxBody> {
        HttpResponse::new(self.status_code())
    }
}

#[cfg(test)]
mod tests {
    use super::{
        super::session_ext::SessionExt,
        SessionStatus,
    };
    use actix_web::{
        test,
        HttpResponse,
    };

    #[actix_web::test]
    async fn session() {
        let req = test::TestRequest::default().to_srv_request();
        let session = req.get_session();

        session.insert("key", "value").unwrap();

        let res = session.get::<String>("key").unwrap();
        assert_eq!(res, Some("value".to_string()));

        session.insert("key2", "value2").unwrap();
        session.remove("key");

        let res = req.into_response(HttpResponse::Ok().finish());
        let state: Vec<_> = res.get_session().entries().clone().into_iter().collect();

        assert_eq!(
            state.as_slice(),
            [("key2".to_string(), "\"value2\"".to_string())]
        );
    }

    #[actix_web::test]
    async fn get_session() {
        let req = test::TestRequest::default().to_srv_request();
        let session = req.get_session();
        session.insert("key", true).unwrap();
        let res = session.get("key").unwrap();

        assert_eq!(res, Some(true));
    }

    #[actix_web::test]
    async fn get_session_from_request_head() {
        let req = test::TestRequest::default().to_srv_request();

        let session = req.get_session();
        session.insert("key", 10).unwrap();
        let res = session.get::<u32>("key").unwrap();
        assert_eq!(res, Some(10));
    }

    #[actix_web::test]
    async fn purge_session() {
        let req = test::TestRequest::default().to_srv_request();
        let session = req.get_session();
        assert_eq!(session.status(), SessionStatus::Unchanged);
        session.purge();
        assert_eq!(session.status(), SessionStatus::Purged);
    }

    #[actix_web::test]
    async fn renew_session() {
        let req = test::TestRequest::default().to_srv_request();
        let session = req.get_session();
        assert_eq!(session.status(), SessionStatus::Unchanged);
        session.renew();
        assert_eq!(session.status(), SessionStatus::Renewed);
    }

    #[actix_web::test]
    async fn insert_session_after_renew() {
        let session = test::TestRequest::default().to_srv_request().get_session();

        session.insert("test_val", "val").unwrap();
        assert_eq!(session.status(), SessionStatus::Changed);

        session.renew();
        assert_eq!(session.status(), SessionStatus::Renewed);

        session.insert("test_val1", "val1").unwrap();
        assert_eq!(session.status(), SessionStatus::Renewed);
    }

    #[actix_web::test]
    async fn remove_session_after_renew() {
        let session = test::TestRequest::default().to_srv_request().get_session();

        session.insert("test_val", "val").unwrap();
        session.remove("test_val").unwrap();
        assert_eq!(session.status(), SessionStatus::Changed);

        session.renew();
        session.insert("test_val", "val").unwrap();
        session.remove("test_val").unwrap();
        assert_eq!(session.status(), SessionStatus::Renewed);
    }

    #[actix_web::test]
    async fn clear_session_after_renew() {
        let session = test::TestRequest::default().to_srv_request().get_session();

        session.clear();
        assert_eq!(session.status(), SessionStatus::Changed);

        session.renew();
        assert_eq!(session.status(), SessionStatus::Renewed);

        session.clear();
        assert_eq!(session.status(), SessionStatus::Renewed);
    }
}
