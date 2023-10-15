use super::{
    middleware::SessionMiddleware,
    storage::RedisSessionStore,
};
use actix_web::cookie::{
    time::Duration,
    Key,
    SameSite,
};

/// A [`SessionMiddleware`] builder.
pub struct SessionMiddlewareBuilder {
    storage_backend: RedisSessionStore,
    configuration: Configuration,
}

#[derive(Clone)]
pub struct Configuration {
    pub cookie: CookieConfiguration,
    pub session: SessionConfiguration,
}

#[derive(Clone)]
pub struct SessionConfiguration {
    pub state_ttl: Duration,
}

#[derive(Clone)]
pub struct CookieConfiguration {
    pub secure: bool,
    pub http_only: bool,
    pub name: String,
    pub same_site: SameSite,
    pub path: String,
    pub domain: String,
    pub max_age: Duration,
    pub key: Key,
}

pub fn default_configuration(key: Key) -> Configuration {
    Configuration {
        cookie: CookieConfiguration {
            secure: true,
            http_only: true,
            name: "_storiny_sess".into(),
            same_site: SameSite::None,
            path: "/".into(),
            domain: "storiny.com".to_string(),
            max_age: Duration::weeks(1),
            key,
        },
        session: SessionConfiguration {
            state_ttl: Duration::weeks(1),
        },
    }
}

impl SessionMiddlewareBuilder {
    pub fn new(store: RedisSessionStore, configuration: Configuration) -> Self {
        Self {
            storage_backend: store,
            configuration,
        }
    }

    /// Sets the name of the cookie used to store the session ID.
    ///
    /// * `name` - Name of the cookie.
    pub fn cookie_name(mut self, name: String) -> Self {
        self.configuration.cookie.name = name;
        self
    }

    /// Sets the `Secure` attribute for the cookie used to store the session ID.
    ///
    /// If the cookie is set as secure, it will only be transmitted when the connection is secure
    /// (using `https`).
    ///
    /// * `secure` - Secure flag.
    pub fn cookie_secure(mut self, secure: bool) -> Self {
        self.configuration.cookie.secure = secure;
        self
    }

    /// Sets the max age of the cookie (and the session TTL)
    ///
    /// * `max_age` - The max age duration.
    pub fn cookie_max_age(mut self, max_age: Duration) -> Self {
        self.configuration.cookie.max_age = max_age;
        self.configuration.session.state_ttl = max_age;
        self
    }

    /// Sets the `SameSite` attribute for the cookie used to store the session ID.
    ///
    /// * `same_site` - The same site value.
    pub fn cookie_same_site(mut self, same_site: SameSite) -> Self {
        self.configuration.cookie.same_site = same_site;
        self
    }

    /// Sets the `Path` attribute for the cookie used to store the session ID.
    ///
    /// * `path` - The path attribute.
    pub fn cookie_path(mut self, path: String) -> Self {
        self.configuration.cookie.path = path;
        self
    }

    /// Sets the `Domain` attribute for the cookie used to store the session ID.
    ///
    /// Use `None` to leave the attribute unspecified. If unspecified, the attribute defaults
    /// to the same host that set the cookie, excluding subdomains.
    ///
    /// * `domain` - The domain attribute.
    pub fn cookie_domain(mut self, domain: String) -> Self {
        self.configuration.cookie.domain = domain;
        self
    }

    /// Set the `HttpOnly` attribute for the cookie used to store the session ID.
    ///
    /// If the cookie is set as `HttpOnly`, it will not be visible to any JavaScript snippets
    /// running in the browser.
    ///
    /// * `http_only` - The HttpOnly attribute.
    pub fn cookie_http_only(mut self, http_only: bool) -> Self {
        self.configuration.cookie.http_only = http_only;
        self
    }

    /// Finalises the builder and returns a [`SessionMiddleware`] instance.
    pub fn build(self) -> SessionMiddleware {
        SessionMiddleware::from_parts(self.storage_backend, self.configuration)
    }
}
