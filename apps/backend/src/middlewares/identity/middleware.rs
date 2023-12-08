use super::{
    config::IdentityMiddlewareBuilder,
    identity::IdentityInner,
};
use actix_utils::future::{
    ready,
    Ready,
};
use actix_web::{
    body::MessageBody,
    dev::{
        Service,
        ServiceRequest,
        ServiceResponse,
        Transform,
    },
    Error,
    HttpMessage as _,
    Result,
};
use futures_core::future::LocalBoxFuture;
use std::rc::Rc;
use storiny_session::SessionExt;

/// Identity management middleware.
#[derive(Default, Clone)]
pub struct IdentityMiddleware {}

#[allow(dead_code)]
impl IdentityMiddleware {
    pub fn new() -> Self {
        Self {}
    }

    /// A fluent API to configure [`IdentityMiddleware`].
    pub fn builder() -> IdentityMiddlewareBuilder {
        IdentityMiddlewareBuilder::new()
    }
}

impl<S, B> Transform<S, ServiceRequest> for IdentityMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = InnerIdentityMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(InnerIdentityMiddleware {
            service: Rc::new(service),
        }))
    }
}

#[doc(hidden)]
pub struct InnerIdentityMiddleware<S> {
    service: Rc<S>,
}

impl<S> Clone for InnerIdentityMiddleware<S> {
    fn clone(&self) -> Self {
        Self {
            service: Rc::clone(&self.service),
        }
    }
}

impl<S, B> Service<ServiceRequest> for InnerIdentityMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    actix_service::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let srv = Rc::clone(&self.service);
        Box::pin(async move {
            let identity_inner = IdentityInner {
                session: req.get_session(),
            };
            req.extensions_mut().insert(identity_inner);
            srv.call(req).await
        })
    }
}
