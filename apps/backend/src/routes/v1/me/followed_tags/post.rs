use crate::{
    constants::resource_limit::ResourceLimit,
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
    tag_id: String,
}

#[post("/v1/me/followed-tags/{tag_id}")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.tag_id.parse::<i64>() {
            Ok(tag_id) => {
                if !check_resource_limit(&data.redis, ResourceLimit::FollowTag, user_id)
                    .await
                    .unwrap_or_default()
                {
                    return Ok(HttpResponse::TooManyRequests()
                        .body("Daily limit exceeded for following tags. Try again tomorrow."));
                }

                match sqlx::query(
                    r#"
                    INSERT INTO tag_followers(user_id, tag_id)
                    VALUES ($1, $2)
                    "#,
                )
                .bind(user_id)
                .bind(tag_id)
                .execute(&data.db_pool)
                .await
                {
                    Ok(_) => {
                        let _ = incr_resource_limit(&data.redis, ResourceLimit::FollowTag, user_id)
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
                                // Target tag is not present in the table
                                sqlx::error::ErrorKind::ForeignKeyViolation => {
                                    Ok(HttpResponse::BadRequest().body("Tag does not exist"))
                                }
                                _ => Ok(HttpResponse::InternalServerError().finish()),
                            }
                        } else {
                            Ok(HttpResponse::InternalServerError().finish())
                        }
                    }
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid tag ID")),
        },
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

    #[sqlx::test]
    async fn can_reject_followed_tag_for_a_missing_tag(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/followed-tags/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Tag does not exist").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("followed_tag"))]
        async fn can_follow_a_tag(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/followed-tags/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Followed tag relation should be present in the database
            let result = sqlx::query(
                r#"
                SELECT EXISTS(
                    SELECT 1 FROM tag_followers
                    WHERE user_id = $1 AND tag_id = $2
                )
                "#,
            )
            .bind(user_id.unwrap())
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::FollowTag, user_id.unwrap())
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_followed_tag_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Exceed the resource limit
            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::FollowTag, user_id.unwrap())
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/followed-tags/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("followed_tag"))]
        async fn should_not_throw_when_following_an_already_followed_tag(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            // Follow the tag for the first time
            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/followed-tags/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Try following the tag again
            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/followed-tags/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should not throw
            assert!(res.status().is_success());

            Ok(())
        }
    }
}
