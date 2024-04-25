use crate::{
    error::AppError,
    utils::decode_unsubscribe_fragment::decode_unsubscribe_fragment,
    AppState,
    UnsubscribeTemplate,
};
use actix_http::StatusCode;
use actix_web::{
    get,
    http::header::ContentType,
    post,
    web,
    HttpResponse,
};
use sailfish::TemplateOnce;
use serde::Deserialize;
use tracing::error;
use validator::Validate;

/// The error raised during unsubscribing a user.
#[derive(Debug)]
enum UnsubscribeError {
    /// The payload is invalid or tampered.
    InvalidPayload,
    /// The user has not subscribed to the blog.
    NotSubscribed,
    /// Internal server error.
    Internal,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    digest: String,
    encoded: String,
}

/// Incoming request handler.
///
/// * `data` - The application state.
/// * `path` - The path fragments.
async fn handle_request(
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
) -> Result<(), UnsubscribeError> {
    let (blog_id, email) =
        decode_unsubscribe_fragment(&data.config.newsletter_secret, &path.digest, &path.encoded)
            .map_err(|_| UnsubscribeError::InvalidPayload)?;

    #[allow(clippy::blocks_in_conditions)]
    match sqlx::query(
        r#"
DELETE FROM subscribers
WHERE
    blog_id = $1
    AND email = $2
"#,
    )
    .bind(blog_id)
    .bind(email)
    .execute(&data.db_pool)
    .await
    .map_err(|err| {
        error!("database error: {err:?}");
        UnsubscribeError::Internal
    })?
    .rows_affected()
    {
        0 => Err(UnsubscribeError::NotSubscribed),
        _ => Ok(()),
    }
}

/// Post request for unsubscribing a user. This is used by various email clients offering one-click
/// unsubscribe functionality.
#[post("/v1/newsletters/unsubscribe/{digest}/{encoded}")]
#[tracing::instrument(
    name = "POST /v1/newsletters/unsubscribe/{digest}/{encoded}",
    skip_all,
    fields(
        digest = %path.digest,
        encoded = %path.encoded
    ),
    err
)]
async fn post(
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
) -> Result<HttpResponse, AppError> {
    handle_request(data, path)
        .await
        .map(|_| HttpResponse::Ok().finish())
        .map_err(|error| match error {
            UnsubscribeError::InvalidPayload => {
                AppError::new_client_error("The digest or payload is invalid or has expired")
            }
            UnsubscribeError::NotSubscribed => AppError::new_client_error_with_status(
                StatusCode::NOT_FOUND,
                "The user with this email is no longer subscribed to this blog",
            ),
            UnsubscribeError::Internal => AppError::InternalError("".to_string()),
        })
}

/// Get request for unsubscribing a user. This provides a GUI for users who have manually clicked on
/// the unsubscribe link from the email's footer.
#[get("/v1/newsletters/unsubscribe/{digest}/{encoded}")]
#[tracing::instrument(
    name = "GET /v1/newsletters/unsubscribe/{digest}/{encoded}",
    skip_all,
    fields(
        digest = %path.digest,
        encoded = %path.encoded
    ),
    err
)]
async fn get(
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
) -> Result<HttpResponse, AppError> {
    let mut status_code: StatusCode = StatusCode::OK;
    let mut message = "You have successfully unsubscribed from this blog.".to_string();

    if let Err(error) = handle_request(data, path).await {
        match error {
            UnsubscribeError::InvalidPayload => {
                status_code = StatusCode::BAD_REQUEST;
                message = "This unsubscribe link is invalid or has expired.".to_string();
            }
            UnsubscribeError::NotSubscribed => {
                status_code = StatusCode::NOT_FOUND;
                message =
                    "This blog does not exist, or you are no longer subscribed to it.".to_string();
            }
            UnsubscribeError::Internal => {
                status_code = StatusCode::INTERNAL_SERVER_ERROR;
                message =
                    "Something went wrong while trying to unsubscribe you. Please try again later."
                        .to_string();
            }
        }
    };

    UnsubscribeTemplate { message }
        .render_once()
        .map(|body| {
            HttpResponse::build(status_code)
                .content_type(ContentType::html())
                .body(body)
        })
        .map_err(|error| AppError::InternalError(error.to_string()))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        config::get_app_config,
        test_utils::init_app_for_test,
        utils::encode_unsubscribe_fragment::encode_unsubscribe_fragment,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    // POST requests

    #[sqlx::test(fixtures("unsubscribe"))]
    async fn can_unsubscribe_from_a_newsletter_using_post_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let config = get_app_config().unwrap();
        let app = init_app_for_test(post, pool, false, false, None).await.0;
        let fragment = encode_unsubscribe_fragment(
            &config.newsletter_secret,
            2_i64.to_string(),
            "subscriber@example.com".to_string(),
        )
        .unwrap();

        let req = test::TestRequest::post()
            .uri(&format!("/v1/newsletters/unsubscribe/{fragment}"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Subscriber should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT FROM subscribers
    WHERE blog_id = $1
)
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_an_invalid_payload_for_a_post_request(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri(&format!("/v1/newsletters/unsubscribe/{}/{}", 12345, 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);

        Ok(())
    }

    #[sqlx::test(fixtures("unsubscribe"))]
    async fn can_handle_an_unknown_subscriber_for_a_post_request(pool: PgPool) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let app = init_app_for_test(post, pool, false, false, None).await.0;
        let fragment = encode_unsubscribe_fragment(
            &config.newsletter_secret,
            2_i64.to_string(),
            "unknown@example.com".to_string(),
        )
        .unwrap();

        let req = test::TestRequest::post()
            .uri(&format!("/v1/newsletters/unsubscribe/{fragment}"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        Ok(())
    }

    // GET requests

    #[sqlx::test(fixtures("unsubscribe"))]
    async fn can_unsubscribe_from_a_newsletter_using_get_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let config = get_app_config().unwrap();
        let app = init_app_for_test(get, pool, false, false, None).await.0;
        let fragment = encode_unsubscribe_fragment(
            &config.newsletter_secret,
            2_i64.to_string(),
            "subscriber@example.com".to_string(),
        )
        .unwrap();

        let req = test::TestRequest::get()
            .uri(&format!("/v1/newsletters/unsubscribe/{fragment}"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Subscriber should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT FROM subscribers
    WHERE blog_id = $1
)
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_an_invalid_payload_for_a_get_request(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/newsletters/unsubscribe/{}/{}", 12345, 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);

        Ok(())
    }

    #[sqlx::test(fixtures("unsubscribe"))]
    async fn can_handle_an_unknown_subscriber_for_a_get_request(pool: PgPool) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let app = init_app_for_test(get, pool, false, false, None).await.0;
        let fragment = encode_unsubscribe_fragment(
            &config.newsletter_secret,
            2_i64.to_string(),
            "unknown@example.com".to_string(),
        )
        .unwrap();

        let req = test::TestRequest::get()
            .uri(&format!("/v1/newsletters/unsubscribe/{fragment}"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        Ok(())
    }
}
