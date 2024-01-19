use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
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
    sensitive_content: bool,
}

#[patch("/v1/me/settings/privacy/sensitive-content")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/privacy/sensitive-content",
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

    match sqlx::query(
        r#"
UPDATE users
SET allow_sensitive_content = $2
WHERE id = $1
"#,
    )
    .bind(user_id)
    .bind(payload.sensitive_content)
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
    async fn can_enable_sensitive_content(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/sensitive-content")
            .set_json(Request {
                sensitive_content: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT allow_sensitive_content FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("allow_sensitive_content"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_disable_sensitive_content(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Enable sensitive content for the user.
        sqlx::query(
            r#"
UPDATE users
SET allow_sensitive_content = TRUE
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/sensitive-content")
            .set_json(Request {
                sensitive_content: false,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT allow_sensitive_content FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("allow_sensitive_content"));

        Ok(())
    }
}
