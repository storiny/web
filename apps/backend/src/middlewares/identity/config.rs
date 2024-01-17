use super::middleware::IdentityMiddleware;

/// A fluent builder to construct an [`IdentityMiddleware`] instance with custom configuration
/// parameters.
///
/// Use [`IdentityMiddleware::builder`] to get started!
#[derive(Debug, Clone)]
pub struct IdentityMiddlewareBuilder {}

#[allow(dead_code)]
impl Default for IdentityMiddlewareBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl IdentityMiddlewareBuilder {
    pub fn new() -> Self {
        Self {}
    }

    /// Finalises the builder and returns an [`IdentityMiddleware`] instance.
    pub fn build(self) -> IdentityMiddleware {
        IdentityMiddleware::new()
    }
}
