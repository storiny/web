use crate::{
    constants::{
        notification_entity_type::NotificationEntityType,
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
    user_id: String,
}

#[post("/v1/me/following/{user_id}")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.user_id.parse::<i64>() {
                Ok(followed_id) => {
                    if !check_resource_limit(&data.redis, ResourceLimit::FollowUser, user_id)
                        .await
                        .unwrap_or_default()
                    {
                        return Ok(HttpResponse::TooManyRequests().body(
                            "Daily limit exceeded for following users. Try again tomorrow.",
                        ));
                    }

                    match sqlx::query(
                        r#"
                        WITH
                            inserted_relation AS (
                                INSERT INTO relations(follower_id, followed_id)
                                VALUES ($1, $2)
                                RETURNING TRUE AS "inserted"
                            ),
                            inserted_notification AS (
                                INSERT INTO notifications (entity_type, entity_id, notifier_id)
                                SELECT $3, $1, $1
                                WHERE EXISTS (
                                    SELECT 1 FROM inserted_relation
                                )
                                RETURNING id
                            )
                        INSERT
                        INTO
                            notification_outs (notified_id, notification_id)
                        SELECT
                            $2, (SELECT id FROM inserted_notification)
                        WHERE EXISTS (
                            SELECT 1 FROM inserted_relation
                        )
                        "#,
                    )
                    .bind(user_id)
                    .bind(followed_id)
                    .bind(NotificationEntityType::FollowerAdd as i16)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => {
                            let _ = incr_resource_limit(
                                &data.redis,
                                ResourceLimit::FollowUser,
                                user_id,
                            )
                            .await;

                            Ok(HttpResponse::Created().finish())
                        }
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    // Do not throw if already followed
                                    sqlx::error::ErrorKind::UniqueViolation => {
                                        Ok(HttpResponse::NoContent().finish())
                                    }
                                    // Target user is not present in the table
                                    sqlx::error::ErrorKind::ForeignKeyViolation => {
                                        Ok(HttpResponse::BadRequest().body("User does not exist"))
                                    }
                                    _ => {
                                        let err_code = db_err.code().unwrap_or_default();

                                        // Check if the followed user is soft-deleted or deactivated
                                        if err_code == SqlState::EntityUnavailable.to_string() {
                                            Ok(HttpResponse::BadRequest().body("User being followed is either deleted or deactivated"))
                                        // Check if `follower_id` is same as `followed_id`
                                        } else if err_code == SqlState::RelationOverlap.to_string()
                                        {
                                            Ok(HttpResponse::BadRequest()
                                                .body("You cannot follow yourself"))
                                        // Check if the user is being blocked by the followed user
                                        } else if err_code
                                            == SqlState::FollowerBlockedByFollowedUser.to_string()
                                        {
                                            Ok(HttpResponse::Forbidden()
                                                .body("You are being blocked by the user you're trying to follow"))
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
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid user ID")),
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
    use actix_web::{
        http::StatusCode,
        test,
    };

    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("following"))]
    async fn should_not_follow_a_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the target user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try following the user
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/following/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "User being followed is either deleted or deactivated")
            .await;

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn should_not_follow_a_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Deactivate the target user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try following the user
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/following/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "User being followed is either deleted or deactivated")
            .await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_allow_the_user_to_follow_itself(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/following/{}", user_id.unwrap()))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "You cannot follow yourself").await;

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_reject_follow_request_when_the_followed_user_has_blocked_the_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Get blocked by the target user
        sqlx::query(
            r#"
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/following/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "You are being blocked by the user you're trying to follow",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_follow_request_for_a_missing_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/following/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "User does not exist").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("following"))]
        async fn can_follow_a_user(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/following/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Following relation should be present in the database
            let result = sqlx::query(
                r#"
                SELECT EXISTS (
                    SELECT 1 FROM relations
                    WHERE follower_id = $1 AND followed_id = $2
                )
                "#,
            )
            .bind(user_id.unwrap())
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also insert a notification
            let result = sqlx::query(
                r#"
                SELECT EXISTS (
                    SELECT 1 FROM notifications
                    WHERE entity_id = $1
                )
                "#,
            )
            .bind(user_id.unwrap())
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::FollowUser, user_id.unwrap())
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_follow_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Exceed the resource limit
            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::FollowUser, user_id.unwrap())
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/following/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("following"))]
        async fn should_not_throw_when_following_an_already_followed_user(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            // Follow the user for the first time
            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/following/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Try following the user again
            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/following/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should not throw
            assert!(res.status().is_success());

            Ok(())
        }
    }
}
