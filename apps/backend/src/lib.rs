use sailfish::TemplateOnce;

#[path = "error.rs"]
pub mod error;

#[path = "models.rs"]
pub mod models;

#[path = "routes.rs"]
pub mod routes;

#[path = "proto.rs"]
pub mod proto;

/// Index page template
#[derive(TemplateOnce)]
#[template(path = "index.stpl")]
pub struct IndexTemplate {
    req_id: String,
}
