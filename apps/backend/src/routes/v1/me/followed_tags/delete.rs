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
    tag_id: String,
}

#[delete("/v1/me/followed-tags/{tag_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/followed-tags/{tag_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        tag_id = %path.tag_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let tag_id = path
        .tag_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid tag ID"))?;

    match sqlx::query(
        r#"
DELETE FROM tag_followers
WHERE
    user_id = $1
    AND tag_id = $2
"#,
    )
    .bind(user_id)
    .bind(tag_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Tag or relation not found")),
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

    #[sqlx::test(fixtures("followed_tag"))]
    async fn can_unfollow_a_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Follow the tag.
        let result = sqlx::query(
            r#"
INSERT INTO tag_followers (user_id, tag_id)
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
            .uri(&format!("/v1/me/followed-tags/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Followed tag relation should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tag_followers
    WHERE user_id = $1 AND tag_id = $2
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
    async fn can_return_an_error_response_when_unfollowing_an_unknown_tag(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/followed-tags/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Tag or relation not found").await;

        Ok(())
    }
}
