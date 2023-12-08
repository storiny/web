//! Configuration options to tune the behaviour of [`SessionMiddleware`].

use actix_web::cookie::{
    time::Duration,
    Key,
    SameSite,
};
use serde::{
    Deserialize,
    Serialize,
};

use crate::{
    storage::SessionStore,
    SessionMiddleware,
};

/// Determines what type of session cookie should be used and how its lifecycle should be managed.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[repr(i32)]
pub enum SessionLifecycle {
    /// The session cookie will expire when the current browser session ends.
    ///
    /// When does a browser session end? It depends on the browser! Chrome, for example, will often
    /// continue running in the background when the browser is closed—session cookies are not
    /// deleted and they will still be available when the browser is opened again.
    /// Check the documentation of the browsers you are targeting for up-to-date information.
    BrowserSession = 0,

    /// The session cookie will be a [persistent cookie].
    ///
    /// Persistent cookies have a pre-determined lifetime, specified via the `Max-Age` or `Expires`
    /// attribute. They do not disappear when the current browser session ends.
    ///
    /// [persistent cookie]: https://www.whitehatsec.com/glossary/content/persistent-session-cookie
    #[default]
    PersistentSession = 1,
}

impl SessionLifecycle {
    /// Converts an `i32` value to `SessionLifecycle`.
    pub fn from_i32(value: i32) -> SessionLifecycle {
        match value {
            0 => SessionLifecycle::BrowserSession,
            _ => SessionLifecycle::PersistentSession,
        }
    }
}

/// A fluent, customized [`SessionMiddleware`] builder.
#[must_use]
pub struct SessionMiddlewareBuilder<Store: SessionStore> {
    storage_backend: Store,
    configuration: Configuration,
}

impl<Store: SessionStore> SessionMiddlewareBuilder<Store> {
    pub(crate) fn new(store: Store, configuration: Configuration) -> Self {
        Self {
            storage_backend: store,
            configuration,
        }
    }

    /// Set the name of the cookie used to store the session ID.
    ///
    /// Defaults to `id`.
    pub fn cookie_name(mut self, name: String) -> Self {
        self.configuration.cookie.name = name;
        self
    }

    /// Set the `Secure` attribute for the cookie used to store the session ID.
    ///
    /// If the cookie is set as secure, it will only be transmitted when the connection is secure
    /// (using `https`).
    ///
    /// Default is `true`.
    pub fn cookie_secure(mut self, secure: bool) -> Self {
        self.configuration.cookie.secure = secure;
        self
    }

    /// Sets the TTL value for the session state and cookie.
    pub fn session_ttl(mut self, ttl: Duration) -> Self {
        self.configuration.session.state_ttl = ttl;
        self.configuration.cookie.max_age = Some(ttl);
        self
    }

    /// Set the `SameSite` attribute for the cookie used to store the session ID.
    ///
    /// By default, the attribute is set to `Lax`.
    pub fn cookie_same_site(mut self, same_site: SameSite) -> Self {
        self.configuration.cookie.same_site = same_site;
        self
    }

    /// Set the `Path` attribute for the cookie used to store the session ID.
    ///
    /// By default, the attribute is set to `/`.
    pub fn cookie_path(mut self, path: String) -> Self {
        self.configuration.cookie.path = path;
        self
    }

    /// Set the `Domain` attribute for the cookie used to store the session ID.
    ///
    /// Use `None` to leave the attribute unspecified. If unspecified, the attribute defaults
    /// to the same host that set the cookie, excluding subdomains.
    ///
    /// By default, the attribute is left unspecified.
    pub fn cookie_domain(mut self, domain: Option<String>) -> Self {
        self.configuration.cookie.domain = domain;
        self
    }

    /// Set the `HttpOnly` attribute for the cookie used to store the session ID.
    ///
    /// If the cookie is set as `HttpOnly`, it will not be visible to any JavaScript snippets
    /// running in the browser.
    ///
    /// Default is `true`.
    pub fn cookie_http_only(mut self, http_only: bool) -> Self {
        self.configuration.cookie.http_only = http_only;
        self
    }

    /// Finalise the builder and return a [`SessionMiddleware`] instance.
    #[must_use]
    pub fn build(self) -> SessionMiddleware<Store> {
        SessionMiddleware::from_parts(self.storage_backend, self.configuration)
    }
}

#[derive(Clone)]
pub(crate) struct Configuration {
    pub(crate) cookie: CookieConfiguration,
    pub(crate) session: SessionConfiguration,
}

#[derive(Clone)]
pub(crate) struct SessionConfiguration {
    pub(crate) state_ttl: Duration,
}

#[derive(Clone)]
pub(crate) struct CookieConfiguration {
    pub(crate) secure: bool,
    pub(crate) http_only: bool,
    pub(crate) name: String,
    pub(crate) same_site: SameSite,
    pub(crate) path: String,
    pub(crate) domain: Option<String>,
    pub(crate) max_age: Option<Duration>,
    pub(crate) key: Key,
}

pub(crate) fn default_configuration(key: Key) -> Configuration {
    Configuration {
        cookie: CookieConfiguration {
            secure: true,
            http_only: true,
            name: "id".into(),
            same_site: SameSite::Lax,
            path: "/".into(),
            domain: None,
            max_age: None,
            key,
        },
        session: SessionConfiguration {
            state_ttl: Duration::weeks(1),
        },
    }
}
