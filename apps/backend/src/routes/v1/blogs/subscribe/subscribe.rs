use crate::{
    amqp::consumers::templated_email::{
        TemplatedEmailMessage,
        TEMPLATED_EMAIL_QUEUE_NAME,
    },
    constants::{
        email_template::EmailTemplate,
        image_size::ImageSize,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    models::email_templates::subscription_confirmation::{
        Blog,
        SubscriptionConfirmationEmailTemplateData,
    },
    utils::{
        check_subscription_limit::check_subscription_limit,
        generate_hashed_token::generate_hashed_token,
        get_blog_url::get_blog_url,
        get_cdn_url::get_cdn_url,
        incr_subscription_limit::incr_subscription_limit,
    },
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::Json;
use chrono::{
    Datelike,
    Local,
};
use deadpool_lapin::lapin::{
    options::BasicPublishOptions,
    BasicProperties,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use time::{
    Duration,
    OffsetDateTime,
};
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
}

#[post("/v1/blogs/{blog_id}/subscribe")]
#[tracing::instrument(
    name = "POST /v1/blogs/{blog_id}/subscribe",
    skip_all,
    fields(
        email = %payload.email
    ),
    err
)]
async fn post(
    req: HttpRequest,
    payload: Json<Request>,
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
) -> Result<HttpResponse, AppError> {
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let subscription_limit_identifier = req
        .connection_info()
        .realip_remote_addr()
        .map(|ip| ip.to_string())
        .ok_or(AppError::ToastError(ToastErrorResponse::new(
            None,
            "You are being rate limited",
        )))?;

    if !check_subscription_limit(&data.redis, &subscription_limit_identifier).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Rate limit exceeded. Join or log into Storiny to subscribe to this newsletter.",
        )
        .into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let blog = sqlx::query(
        r#"
SELECT name, slug, domain, logo_id
FROM blogs
WHERE
    id = $1
    AND deleted_at IS NULL
"#,
    )
    .bind(blog_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(None, "Unknown blog"))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    let subscriber = sqlx::query(
        r#"
SELECT EXISTS (
    SELECT FROM subscribers
    WHERE
        email = $1
        AND blog_id = $2
)
"#,
    )
    .bind(&payload.email)
    .bind(blog_id)
    .fetch_one(&mut *txn)
    .await?;

    // Check if the email has already been subscribed.
    if subscriber.get::<bool, _>("exists") {
        return Err(FormErrorResponse::new(
            None,
            vec![(
                "email",
                "This e-mail has already been subscribed to this blog.",
            )],
        )
        .into());
    }

    // Generate a new verification token.
    let (token_id, hashed_token) = generate_hashed_token(&data.config.token_salt)?;

    // Delete old token
    sqlx::query(
        r#"
DELETE FROM newsletter_tokens
WHERE blog_id = $1 AND email = $2
"#,
    )
    .bind(blog_id)
    .bind(&payload.email)
    .execute(&mut *txn)
    .await?;

    sqlx::query(
        r#"
INSERT INTO newsletter_tokens (id, blog_id, email, expires_at)
VALUES ($1, $2, $3, $4)
"#,
    )
    .bind(&hashed_token)
    .bind(blog_id)
    .bind(&payload.email)
    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
    .execute(&mut *txn)
    .await?;

    // Increment the subscription attempts for IP.
    incr_subscription_limit(&data.redis, &subscription_limit_identifier).await?;

    let blog_url = get_blog_url(
        blog.get::<String, _>("slug"),
        blog.get::<Option<String>, _>("domain"),
    );

    let template_data = serde_json::to_string(&SubscriptionConfirmationEmailTemplateData {
        link: format!("{blog_url}/newsletter/{token_id}"),
        blog: Blog {
            name: blog.get::<String, _>("name"),
            url: blog_url,
            logo_url: blog.get::<Option<Uuid>, _>("logo_id").map(|value| {
                get_cdn_url(
                    &data.config.cdn_server_url,
                    value.to_string().as_str(),
                    Some(ImageSize::W128),
                )
            }),
        },
        copyright_year: Local::now().year().to_string(),
    })
    .map_err(|error| {
        AppError::InternalError(format!("unable to serialize the template data: {error:?}"))
    })?;

    // Publish a message for the subscription verification email.
    {
        let channel = {
            let lapin = &data.lapin;
            let connection = lapin.get().await?;
            connection.create_channel().await?
        };

        let message = serde_json::to_vec(&TemplatedEmailMessage {
            destination: payload.email.to_string(),
            template: EmailTemplate::SubscriptionConfirmation.to_string(),
            template_data,
        })
        .map_err(|error| {
            AppError::InternalError(format!("unable to serialize the message: {error:?}"))
        })?;

        channel
            .basic_publish(
                "",
                TEMPLATED_EMAIL_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await?;
    }

    txn.commit().await?;

    Ok(HttpResponse::Created().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        assert_toast_error_response,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use std::net::{
        Ipv4Addr,
        SocketAddr,
        SocketAddrV4,
    };
    use storiny_macros::test_context;

    #[sqlx::test]
    async fn can_reject_a_subscription_request_for_an_invalid_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .peer_addr(SocketAddr::from(SocketAddrV4::new(
                Ipv4Addr::new(8, 8, 8, 8),
                8080,
            )))
            .uri(&format!("/v1/blogs/{}/subscribe", 12345))
            .set_json(Request {
                email: "random@example.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_reject_a_subscription_request_for_a_deleted_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        // Soft-delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
        "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .peer_addr(SocketAddr::from(SocketAddrV4::new(
                Ipv4Addr::new(8, 8, 8, 8),
                8080,
            )))
            .uri(&format!("/v1/blogs/{}/subscribe", 2))
            .set_json(Request {
                email: "random@example.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_reject_a_subscription_request_for_an_already_subscribed_email(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        // Subscribe to the newsletter.
        let result = sqlx::query(
            r#"
INSERT INTO subscribers (email, blog_id)
VALUES ($1, $2)
        "#,
        )
        .bind("someone@example.com".to_string())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .peer_addr(SocketAddr::from(SocketAddrV4::new(
                Ipv4Addr::new(8, 8, 8, 8),
                8080,
            )))
            .uri(&format!("/v1/blogs/{}/subscribe", 2))
            .set_json(Request {
                email: "someone@example.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![(
                "email",
                "This e-mail has already been subscribed to this blog.",
            )],
        )
        .await;

        Ok(())
    }

    mod serial {
        use super::*;
        use crate::{
            config::get_app_config,
            constants::{
                redis_namespaces::RedisNamespace,
                resource_limit::ResourceLimit,
            },
        };
        use futures_util::future;
        use redis::AsyncCommands;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("blog"))]
        async fn can_handle_a_subscription_request(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            let req = test::TestRequest::post()
                .peer_addr(SocketAddr::from(SocketAddrV4::new(
                    Ipv4Addr::new(8, 8, 8, 8),
                    8080,
                )))
                .uri(&format!("/v1/blogs/{}/subscribe", 2))
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Should insert a verification token into the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM newsletter_tokens
    WHERE blog_id = $1
)
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();

            // Should also increment the subscription limit.
            let result = redis_conn
                .get::<_, u32>(&format!(
                    "{}:{}:{}",
                    RedisNamespace::ResourceLimit,
                    ResourceLimit::SubscribeUnregistered as i32,
                    "8.8.8.8"
                ))
                .await
                .expect("subscription limit has not been set");

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_subscription_request_on_exceeding_the_subscription_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let app = init_app_for_test(post, pool, false, false, None).await.0;
            let mut incr_futures = vec![];

            for _ in 0..ResourceLimit::CreateReport.get_limit() + 1 {
                incr_futures.push(incr_subscription_limit(redis_pool, "8.8.8.8"));
            }

            future::join_all(incr_futures).await;

            let req = test::TestRequest::post()
                .peer_addr(SocketAddr::from(SocketAddrV4::new(
                    Ipv4Addr::new(8, 8, 8, 8),
                    8080,
                )))
                .uri(&format!("/v1/blogs/{}/subscribe", 2))
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("blog"))]
        async fn can_delete_previous_newsletter_tokens_for_the_client(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;
            let config = get_app_config().unwrap();
            let (_, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

            // Insert a newsletter token.
            let result = sqlx::query(
                r#"
INSERT INTO newsletter_tokens (id, email, blog_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
            )
            .bind(&hashed_token)
            .bind("someone@example.com")
            .bind(2_i64)
            .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .peer_addr(SocketAddr::from(SocketAddrV4::new(
                    Ipv4Addr::new(8, 8, 8, 8),
                    8080,
                )))
                .uri(&format!("/v1/blogs/{}/subscribe", 2))
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Should delete the previous token.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM newsletter_tokens
    WHERE id = $1
)
"#,
            )
            .bind(&hashed_token)
            .fetch_one(&mut *conn)
            .await?;

            assert!(!result.get::<bool, _>("exists"));

            Ok(())
        }
    }
}
