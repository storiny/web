use super::error::{
    GetIdentityError,
    LoginError,
    LostIdentityError,
    MissingIdentityError,
    SessionExpiryError,
};
use actix_utils::future::{
    ready,
    Ready,
};
use actix_web::{
    cookie::time::OffsetDateTime,
    dev::{
        Extensions,
        Payload,
    },
    Error,
    FromRequest,
    HttpMessage,
    HttpRequest,
    HttpResponse,
};
use serde_json::Value;
use storiny_session::Session;

/// A verified user identity. It can be used as a request extractor.
///
/// The lifecycle of a user identity is tied to the lifecycle of the underlying session. If the
/// session is destroyed (e.g. the session expired), the user identity will be forgotten, de-facto
/// forcing a user log out.
///
/// # Extractor Behaviour
/// The API will return a `401 UNAUTHORIZED` to the caller when a request does
/// not have a valid identity attached.
pub struct Identity(IdentityInner);

#[derive(Clone)]
pub struct IdentityInner {
    pub session: Session,
}

impl IdentityInner {
    fn extract(ext: &Extensions) -> Self {
        #[allow(clippy::expect_used)]
        ext.get::<Self>()
            .expect(
                "No `IdentityInner` instance was found in the extensions attached to the \
                incoming request. This usually means that `IdentityMiddleware` has not been \
                registered as a middleware via `App::wrap`.",
            )
            .to_owned()
    }

    /// Retrieve the user id attached to the current session.
    fn get_identity(&self) -> Result<String, GetIdentityError> {
        self.session
            .get::<i64>(ID_KEY)?
            .ok_or_else(|| MissingIdentityError.into())
            .map(|id| id.to_string())
    }
}

static ID_KEY: &str = "user_id";
static LOGIN_UNIX_TIMESTAMP_KEY: &str = "created_at";

#[allow(dead_code)]
impl Identity {
    /// Returns the user id associated to the current session.
    pub fn id(&self) -> Result<i64, GetIdentityError> {
        Ok(self
            .0
            .session
            .get::<i64>(ID_KEY)?
            .ok_or(LostIdentityError)?)
    }

    /// Attaches a valid user identity to the current session.
    ///
    /// This method should be called after we have successfully authenticated the user. After
    /// `login` has been called, the user will be able to access all routes that require a valid
    /// [`Identity`].
    ///
    /// * `id` - ID of the user.
    pub fn login(ext: &Extensions, id: i64) -> Result<Self, LoginError> {
        let inner = IdentityInner::extract(ext);
        inner.session.insert(ID_KEY, Value::from(id));
        let now = OffsetDateTime::now_utc().unix_timestamp();
        inner
            .session
            .insert(LOGIN_UNIX_TIMESTAMP_KEY, Value::from(now));
        inner.session.insert("ack", Value::from(false)); // Acknowledged flag
        inner.session.renew();

        Ok(Self(inner))
    }

    /// Removes the user identity from the current session.
    ///
    /// After `logout` has been called, the user will no longer be able to access routes that
    /// require a valid [`Identity`].
    pub fn logout(self) {
        self.0.session.purge();
    }

    pub fn extract(ext: &Extensions) -> Result<Self, GetIdentityError> {
        let inner = IdentityInner::extract(ext);
        inner.get_identity()?;
        Ok(Self(inner))
    }

    pub fn logged_at(&self) -> Result<Option<OffsetDateTime>, GetIdentityError> {
        Ok(self
            .0
            .session
            .get::<i64>(LOGIN_UNIX_TIMESTAMP_KEY)?
            .map(OffsetDateTime::from_unix_timestamp)
            .transpose()
            .map_err(SessionExpiryError)?)
    }
}

/// Extractor implementation for [`Identity`].
impl FromRequest for Identity {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    #[inline]
    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        ready(Identity::extract(&req.extensions()).map_err(|err| {
            let res = actix_web::error::InternalError::from_response(
                err,
                HttpResponse::Unauthorized().body("Unauthorized"),
            );

            actix_web::Error::from(res)
        }))
    }
}
