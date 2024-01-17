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
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blocked_id: String,
}

#[delete("/v1/me/blocked-users/{blocked_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/blocked-users/{blocked_id}",
    skip_all,
    fields(
        blocker_id = user.id().ok(),
        blocked_id = %path.blocked_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let blocker_id = user.id()?;
    let blocked_id = path
        .blocked_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blocked user ID"))?;

    match sqlx::query(
        r#"
DELETE FROM blocks
WHERE
    blocker_id = $1
    AND blocked_id = $2
"#,
    )
    .bind(blocker_id)
    .bind(blocked_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Blocked user not found")),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("user"))]
    async fn can_unblock_a_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Block the user.
        let result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blocked-users/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Block should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE blocker_id = $1 AND blocked_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_unblocking_an_unknown_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blocked-users/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blocked user not found").await;

        Ok(())
    }
}
