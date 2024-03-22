use crate::{
    constants::{
        reserved_keywords::RESERVED_KEYWORDS,
        username_regex::USERNAME_REGEX,
    },
    error::AppError,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use slugify::slugify;
use sqlx::Row;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "USERNAME_REGEX")]
    #[validate(length(min = 3, max = 24, message = "Invalid username length"))]
    username: String,
}

#[post("/v1/public/validation/username")]
#[tracing::instrument(
    name = "POST /v1/public/validation/username",
    skip_all,
    fields(payload),
    err
)]
async fn post(payload: Json<Request>, data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    let slugged_username = slugify!(&payload.username, separator = "_", max_length = 24);

    // Check if username is reserved.
    if RESERVED_KEYWORDS.contains(&slugged_username.as_str()) {
        return Err(AppError::from("Bad username"));
    }

    let username_check = sqlx::query(
        r#"
SELECT EXISTS (
    SELECT 1 FROM users
    WHERE username = $1
)
"#,
    )
    .bind(&slugged_username)
    .fetch_one(&data.db_pool)
    .await?;

    if username_check.get::<bool, _>("exists") {
        return Err(AppError::from("This username is already in use"));
    }

    Ok(HttpResponse::Ok().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_validate_a_username(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/public/validation/username")
            .set_json(Request {
                username: "some_username".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_reserved_username(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/public/validation/username")
            .set_json(Request {
                username: RESERVED_KEYWORDS[10].to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Bad username").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_used_username(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        // Insert a user with a specific username.
        let result = sqlx::query(
            r#"
INSERT INTO users (name, username, email)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample user")
        .bind("sample_username")
        .bind("sample@example.com")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .uri("/v1/public/validation/username")
            .set_json(Request {
                username: "sample_username".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "This username is already in use").await;

        Ok(())
    }
}
