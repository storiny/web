use crate::{
    constants::{
        resource_limit::ResourceLimit,
        sql_states::SqlState,
    },
    error::AppError,
    middlewares::identity::identity::Identity,
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
    },
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
    comment_id: String,
}

#[post("/v1/me/liked-comments/{comment_id}")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.comment_id.parse::<i64>() {
                Ok(comment_id) => {
                    if !check_resource_limit(&data.redis, ResourceLimit::LikeComment, user_id)
                        .await
                        .unwrap_or_default()
                    {
                        return Ok(HttpResponse::TooManyRequests().body(
                            "Daily limit exceeded for liking comments. Try again tomorrow.",
                        ));
                    }

                    match sqlx::query(
                        r#"
                        INSERT INTO comment_likes(user_id, comment_id)
                        VALUES ($1, $2)
                        "#,
                    )
                    .bind(user_id)
                    .bind(comment_id)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => {
                            let _ = incr_resource_limit(
                                &data.redis,
                                ResourceLimit::LikeComment,
                                user_id,
                            )
                            .await;

                            Ok(HttpResponse::Created().finish())
                        }
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    // Do not throw if already liked
                                    sqlx::error::ErrorKind::UniqueViolation => {
                                        Ok(HttpResponse::NoContent().finish())
                                    }
                                    // Target comment is not present in the table
                                    sqlx::error::ErrorKind::ForeignKeyViolation => {
                                        Ok(HttpResponse::BadRequest()
                                            .body("Comment does not exist"))
                                    }
                                    _ => {
                                        // Check if the comment is soft-deleted
                                        if db_err.code().unwrap_or_default()
                                            == SqlState::EntityUnavailable.to_string()
                                        {
                                            Ok(HttpResponse::BadRequest()
                                                .body("Comment being liked is deleted"))
                                        } else {
                                            Ok(HttpResponse::InternalServerError().finish())
                                        }
                                    }
                                }
                            } else {
                                Ok(HttpResponse::InternalServerError().finish())
                            }
                        }
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid comment ID")),
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
        assert_response_body_text,
        exceed_resource_limit,
        get_resource_limit,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_http::StatusCode;
    use actix_web::test;

    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("liked_comment"))]
    async fn should_not_like_a_soft_deleted_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the comment
        let result = sqlx::query(
            r#"
            UPDATE comments
            SET deleted_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try liking the comment
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-comments/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Comment being liked is deleted").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_comment_like_for_a_missing_comment(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/liked-comments/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Comment does not exist").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("liked_comment"))]
        async fn can_like_a_comment(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/liked-comments/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Comment like should be present in the database
            let result = sqlx::query(
                r#"
                SELECT EXISTS (
                    SELECT 1 FROM comment_likes
                    WHERE user_id = $1 AND comment_id = $2
                )
                "#,
            )
            .bind(user_id)
            .bind(3_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit
            let result = get_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::LikeComment,
                user_id.unwrap(),
            )
            .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_comment_like_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Exceed the resource limit
            exceed_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::LikeComment,
                user_id.unwrap(),
            )
            .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/liked-comments/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("liked_comment"))]
        async fn should_not_throw_when_liking_an_already_liked_comment(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            // Like the comment for the first time
            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/liked-comments/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Try liking the comment again
            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/liked-comments/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should not throw
            assert!(res.status().is_success());

            Ok(())
        }
    }
}
