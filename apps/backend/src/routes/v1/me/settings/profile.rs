use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    utils::md_to_html::{
        md_to_html,
        MarkdownSource,
    },
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 3, max = 32, message = "Invalid name length"))]
    name: String,
    #[validate(length(min = 0, max = 256, message = "Invalid bio length"))]
    bio: String,
    #[validate(length(min = 0, max = 36, message = "Invalid location length"))]
    location: String,
}

#[patch("/v1/me/settings/profile")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/profile",
    skip_all,
    fields(
        user = user.id().ok(),
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let bio = payload.bio.trim();
    let rendered_bio = if bio.is_empty() {
        "".to_string()
    } else {
        md_to_html(MarkdownSource::Bio(bio))
    };

    match sqlx::query(
        r#"
UPDATE users
SET
    bio = $1,
    rendered_bio = $2,
    name = $3,
    location = $4
WHERE id = $5
"#,
    )
    .bind(bio)
    .bind(&rendered_bio)
    .bind(&payload.name)
    .bind(&payload.location)
    .bind(user_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::InternalError(
            "user not found in database".to_string(),
        )),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::init_app_for_test;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_update_profile(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/profile")
            .set_json(Request {
                name: "New name".to_string(),
                bio: "Some **new** bio".to_string(),
                location: "Earth".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database, with rendered bio.
        let result = sqlx::query(
            r#"
SELECT
    bio,
    rendered_bio,
    name,
    location
FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("bio"),
            "Some **new** bio".to_string()
        );
        assert_eq!(
            result.get::<String, _>("rendered_bio"),
            md_to_html(MarkdownSource::Bio("Some **new** bio"))
        );
        assert_eq!(result.get::<String, _>("name"), "New name".to_string());
        assert_eq!(result.get::<String, _>("location"), "Earth".to_string());

        Ok(())
    }
}
