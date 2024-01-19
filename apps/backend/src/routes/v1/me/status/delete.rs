use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    delete,
    web,
    HttpResponse,
};

#[delete("/v1/me/status")]
#[tracing::instrument(
    name = "DELETE /v1/me/status",
    skip_all,
    fields(
        user_id = user.id().ok()
    ),
    err
)]
async fn delete(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    sqlx::query(
        r#"
DELETE FROM user_statuses
WHERE user_id = $1
"#,
    )
    .bind(user_id)
    .execute(&data.db_pool)
    .await?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
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
    async fn can_clear_a_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Set a status.
        let result = sqlx::query(
            r#"
INSERT INTO user_statuses (user_id)
VALUES ($1)
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Status should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM user_statuses
    WHERE user_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_throw_when_trying_to_clear_an_unknown_status(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        Ok(())
    }
}
