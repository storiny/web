// TODO: (alpha) Remove alpha alpha

use crate::middlewares::identity::identity::Identity;
use actix_web::{
    dev::{
        forward_ready,
        Service,
        ServiceRequest,
        ServiceResponse,
        Transform,
    },
    Error,
    FromRequest,
};
use futures_util::future::LocalBoxFuture;
use std::future::{
    ready,
    Ready,
};

// There are two steps in middleware processing.
// 1. Middleware initialization, middleware factory gets called with next service in chain as
//    parameter.
// 2. Middleware's call method gets called with normal request.
pub struct AlphaIdentity;

// Middleware factory is `Transform` trait
// `S` - type of the next service
// `B` - type of response's body
impl<S, B> Transform<S, ServiceRequest> for AlphaIdentity
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AlphaIdentityMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AlphaIdentityMiddleware { service }))
    }
}

pub struct AlphaIdentityMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AlphaIdentityMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, mut req: ServiceRequest) -> Self::Future {
        let parts = req.parts_mut();
        let id_fut = Identity::from_request(parts.0, parts.1);
        let fut = self.service.call(req);

        Box::pin(async move {
            id_fut.await?;

            let res = fut.await?;
            Ok(res)
        })
    }
}
