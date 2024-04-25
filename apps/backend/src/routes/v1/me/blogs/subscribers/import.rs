use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::StatusCode;
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
use sqlx::Row;
use time::{
    Duration,
    OffsetDateTime,
};
use validator::{
    validate_email,
    Validate,
};

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    // Maximum of 20,000 emails can be imported at a time.
    #[validate(length(min = 1, max = 20_000))]
    data: Vec<String>,
}

#[post("/v1/me/blogs/{blog_id}/subscribers/import")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/subscribers/import",
    skip_all,
    fields(
        current_user_id = user.id().ok(),
        blog_id = %path.blog_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    payload: Json<Request>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let current_user_id = user.id()?;

    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let emails = &payload.data;

    // Validate data.
    {
        if emails.is_empty() {
            return Err(AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNPROCESSABLE_ENTITY),
                "Data must contain at least one valid email address",
            )));
        }

        if emails.len() > 20_000 {
            return Err(AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNPROCESSABLE_ENTITY),
                "Data should not exceed 20,000 emails",
            )));
        }

        if emails.iter().any(|email| {
            let length = email.chars().count();
            !(3..=300).contains(&length) || !validate_email(email)
        }) {
            return Err(AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNPROCESSABLE_ENTITY),
                "Data contains invalid values",
            )));
        }
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let blog = sqlx::query(
        r#"
SELECT subscribers_imported_at
FROM blogs
WHERE
    id = $1
    AND user_id = $2
    AND deleted_at IS NULL
"#,
    )
    .bind(blog_id)
    .bind(current_user_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::from("Unknown blog")
        } else {
            AppError::SqlxError(error)
        }
    })?;

    // Check whether subscribers were imported recently.
    if let Some(subscribers_imported_at) =
        blog.get::<Option<OffsetDateTime>, _>("subscribers_imported_at")
    {
        let past_week = OffsetDateTime::now_utc() - Duration::weeks(1);

        if subscribers_imported_at > past_week {
            return Err(AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::TOO_MANY_REQUESTS),
                "You can only import subscribers once a week",
            )));
        }
    }

    let insert_count = sqlx::query(
        r#"
INSERT INTO subscribers (email, blog_id)
SELECT UNNEST($2::TEXT[]), $1
-- Ignore duplicate subscribers
ON CONFLICT DO NOTHING
"#,
    )
    .bind(blog_id)
    .bind(&emails[..])
    .execute(&mut *txn)
    .await?
    .rows_affected();

    if insert_count == 0 {
        txn.commit().await?;

        Ok(HttpResponse::Ok().finish())
    } else {
        // Update `subscribers_imported_at` field.
        sqlx::query(
            r#"
UPDATE blogs
SET subscribers_imported_at = NOW()
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *txn)
        .await?;

        txn.commit().await?;

        Ok(HttpResponse::Created().finish())
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
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("blog"))]
    async fn can_import_subscribers_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .set_json(Request {
                data: vec![
                    "subscriber-1@example.com".to_string(),
                    "subscriber-2@example.com".to_string(),
                    "subscriber-3@example.com".to_string(),
                ],
            })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown blog").await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                data: vec![
                    "subscriber-1@example.com".to_string(),
                    "subscriber-2@example.com".to_string(),
                    "subscriber-3@example.com".to_string(),
                ],
            })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Subscribers should be present in the database.
        let result = sqlx::query(
            r#"
SELECT FROM subscribers
WHERE blog_id = $1
"#,
        )
        .bind(3_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 3);

        // Should update the `subscribers_imported_at` field.
        let result = sqlx::query(
            r#"
SELECT subscribers_imported_at
FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("subscribers_imported_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_reject_import_subscribers_request_for_invalid_data(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                data: vec!["invalid_email".to_string()],
            })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_reject_import_subscribers_request_for_outbound_data_length(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Underflow
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .set_json(Request { data: vec![] })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        // Overflow
        let mut emails = Vec::new();

        for i in 0..25_000 {
            emails.push(format!("subscriber-{i}@example.com"));
        }

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request { data: emails })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_reject_an_import_subscribers_request_for_a_soft_deleted_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Soft-delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending the import request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                data: vec!["someone@example.com".to_string()],
            })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_import_subscribers_request_for_a_missing_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                data: vec!["someone@example.com".to_string()],
            })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_reject_an_import_subscribers_request_for_a_blog_on_cooldown_period(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Put the blog on a cooldown period.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET subscribers_imported_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                data: vec!["someone@example.com".to_string()],
            })
            .uri(&format!("/v1/me/blogs/{}/subscribers/import", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You can only import subscribers once a week").await;

        Ok(())
    }
}
