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
    read_history: bool,
}

#[patch("/v1/me/settings/privacy/read-history")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/privacy/read-history",
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
SET disable_read_history = $2
WHERE id = $1
"#,
    )
    .bind(user_id)
    .bind(!(&payload.read_history))
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
    async fn can_disable_read_history(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/read-history")
            .set_json(Request {
                read_history: false,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT disable_read_history FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("disable_read_history"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_enable_read_history(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Disable read history for the user.
        sqlx::query(
            r#"
UPDATE users
SET disable_read_history = TRUE
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/read-history")
            .set_json(Request { read_history: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT disable_read_history FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("disable_read_history"));

        Ok(())
    }
}
