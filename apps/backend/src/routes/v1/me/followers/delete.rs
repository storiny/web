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
    follower_id: String,
}

#[delete("/v1/me/followers/{follower_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/followers/{follower_id}",
    skip_all,
    fields(
        followed_id = user.id().ok(),
        follower_id = %path.follower_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let followed_id = user.id()?;
    let follower_id = path
        .follower_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    match sqlx::query(
        r#"
DELETE FROM relations
WHERE
    follower_id = $1
    AND followed_id = $2
"#,
    )
    .bind(follower_id)
    .bind(followed_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Follower not found")),
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

    #[sqlx::test(fixtures("follower"))]
    async fn can_remove_a_follower(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Get followed by a user.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/followers/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Follower relation should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM relations
    WHERE follower_id = $1 AND followed_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_removing_an_unknown_follower(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/followers/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Follower not found").await;

        Ok(())
    }
}
