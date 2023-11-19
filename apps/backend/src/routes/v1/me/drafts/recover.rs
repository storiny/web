use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    draft_id: String,
}

#[post("/v1/me/drafts/{draft_id}/recover")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.draft_id.parse::<i64>() {
                Ok(draft_id) => {
                    match sqlx::query(
                        r#"
                    UPDATE stories
                    SET deleted_at = NULL
                    WHERE
                        user_id = $1
                        AND id = $2
                        AND published_at IS NULL
                        AND deleted_at IS NOT NULL
                    "#,
                    )
                    .bind(user_id)
                    .bind(draft_id)
                    .execute(&data.db_pool)
                    .await?
                    .rows_affected()
                    {
                        0 => Ok(HttpResponse::BadRequest()
                            .json(ToastErrorResponse::new("Draft not found"))),
                        _ => Ok(HttpResponse::NoContent().finish()),
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid draft ID")),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use time::OffsetDateTime;

    #[sqlx::test]
    async fn can_recover_a_draft(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

        // Insert a deleted draft
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, deleted_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/drafts/{}/recover", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Draft should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_recover_a_published_draft(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

        // Insert a published and deleted draft
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, published_at, deleted_at)
            VALUES ($1, $2, now(), now())
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/drafts/{}/recover", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Draft not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_recovering_an_unknown_draft(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/drafts/{}/recover", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Draft not found").await;

        Ok(())
    }
}
