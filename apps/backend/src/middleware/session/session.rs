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
use serde::{
    de::DeserializeOwned,
    Serialize,
};
use std::{
    cell::RefCell,
    collections::HashMap,
    error::Error as StdError,
    mem,
    rc::Rc,
};

/// The primary interface to access and modify session state.
#[derive(Clone)]
pub struct Session(Rc<RefCell<SessionInner>>);

/// Status of a [`Session`].
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum SessionStatus {
    /// Session state has been updated - the changes will have to be persisted to the Redis
    /// backend.
    Changed,
    /// The session has been flagged for deletion - the session cookie will be removed from
    /// the client and the session state will be deleted from the Redis session store.
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
    state: HashMap<String, String>,
    status: SessionStatus,
}

impl Session {
    /// Returns a value from the session.
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

    // /// Returns all raw key-value data from the session.
    // ///
    // /// Note that values are JSON encoded.
    // pub fn entries(&self) -> Ref<'_, HashMap<String, String>> {
    //     Ref::map(self.0.borrow(), |inner| &inner.state)
    // }
    //
    // /// Returns session status.
    // pub fn status(&self) -> SessionStatus {
    //     Ref::map(self.0.borrow(), |inner| &inner.status).clone()
    // }

    /// Inserts a key-value pair into the session.
    ///
    /// Any serializable value can be used and will be encoded as JSON in session data, hence why
    /// only a reference to the value is taken.
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

    /// Removes value from the session.
    ///
    /// If present, the JSON encoded value is returned.
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

    // /// Removes value from the session and deserializes.
    // ///
    // /// Returns `None` if key was not present in session. Returns `T` if deserialization
    // succeeds, /// otherwise returns un-deserialized JSON string.
    // pub fn remove_as<T: DeserializeOwned>(&self, key: &str) -> Option<Result<T, String>> {
    //     self.remove(key)
    //         .map(|val_str| match serde_json::from_str(&val_str) {
    //             Ok(val) => Ok(val),
    //             Err(_err) => {
    //                 tracing::debug!(
    //                     "Removed value (key: {}) could not be deserialized as {}",
    //                     key,
    //                     std::any::type_name::<T>()
    //                 );
    //
    //                 Err(val_str)
    //             }
    //         })
    // }

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

    /// Removes the session from both client and server side.
    pub fn purge(&self) {
        let mut inner = self.0.borrow_mut();
        inner.status = SessionStatus::Purged;
        inner.state.clear();
    }

    /// Renews the session key along with optional user ID, assigning existing session state to new
    /// key.
    pub fn renew(&self) {
        let mut inner = self.0.borrow_mut();
        if inner.status != SessionStatus::Purged {
            inner.status = SessionStatus::Renewed;
        }
    }

    /// Adds the given key-value pairs to the session on the request.
    ///
    /// Values that match keys already existing on the session will be overwritten. Values should
    /// already be JSON serialized.
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
