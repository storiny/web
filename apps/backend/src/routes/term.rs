use crate::realms::realm::{
    RealmData,
    RealmDestroyReason,
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};
use lockable::AsyncLimit;
use std::sync::Arc;

#[get("/term")]
async fn get(realm_map: RealmData) -> impl Responder {
    {
        let mut realm = realm_map
            .async_lock(38845050418889731_i64, AsyncLimit::no_limit())
            .await
            .unwrap();
        {
            let rel = realm.value().unwrap();
            rel.destroy(RealmDestroyReason::StoryPublished).await;
        }
        realm.remove();
    }

    HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body("OK")
}

/// Registers health routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
