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
    http::StatusCode,
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blocked_id: String,
}

#[post("/v1/me/blocked-users/{blocked_id}")]
#[tracing::instrument(
    name = "POST /v1/me/blocked-users/{blocked_id}",
    skip_all,
    fields(
        blocker_id = user.id().ok(),
        blocked_id = %path.blocked_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let blocker_id = user.id()?;
    let blocked_id = path
        .blocked_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blocked user ID"))?;

    if !check_resource_limit(&data.redis, ResourceLimit::BlockUser, blocker_id).await? {
        return Err(AppError::new_client_error_with_status(
            StatusCode::TOO_MANY_REQUESTS,
            "Daily limit exceeded for blocking users. Try again tomorrow.",
        ));
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
    )
    .bind(blocker_id)
    .bind(blocked_id)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            incr_resource_limit(&data.redis, ResourceLimit::BlockUser, blocker_id).await?;

            txn.commit().await?;

            Ok(HttpResponse::Created().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // Do not throw if the user is already blocked.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Ok(HttpResponse::NoContent().finish());
                }

                // Target user is not present in the table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::from("User does not exist"));
                }

                let error_code = db_err.code().unwrap_or_default();

                // Check if the `blocker_id` is same as `blocked_id`.
                if error_code == SqlState::RelationOverlap.to_string() {
                    return Err(AppError::from("You cannot block yourself"));
                }

                // Check if the blocked user is soft-deleted or deactivated.
                if error_code == SqlState::EntityUnavailable.to_string() {
                    return Err(AppError::from(
                        "User being blocked is either deleted or deactivated",
                    ));
                }
            }

            Err(AppError::SqlxError(error))
        }
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

    #[sqlx::test(fixtures("user"))]
    async fn should_not_block_a_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the target user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try blocking the user.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blocked-users/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "User being blocked is either deleted or deactivated").await;

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_block_a_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Deactivate the target user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try blocking the user.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blocked-users/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "User being blocked is either deleted or deactivated").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_allow_the_user_to_block_itself(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blocked-users/{}", user_id.unwrap()))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "You cannot block yourself").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_block_request_for_a_missing_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blocked-users/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "User does not exist").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_block_a_user(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blocked-users/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Block should be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE blocker_id = $1 AND blocked_id = $2
)
"#,
            )
            .bind(user_id.unwrap())
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::BlockUser, user_id.unwrap())
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_block_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::BlockUser, user_id.unwrap())
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blocked-users/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn should_not_throw_when_blocking_an_already_blocked_user(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            // Block the user for the first time.
            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/blocked-users/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Try blocking the user again.
            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blocked-users/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should not throw.
            assert!(res.status().is_success());

            Ok(())
        }
    }
}
