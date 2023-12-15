use crate::{
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

// TODO: (alpha) Remove this route in beta

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 6, max = 12, message = "Invalid invite code length"))]
    alpha_invite_code: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Response {
    is_valid: bool,
}

#[post("/v1/auth/invite-code-preflight")]
#[tracing::instrument(
    name = "POST /v1/auth/invite-code-preflight",
    skip_all,
    fields(
        invite_code = %payload.alpha_invite_code
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Return early if the user is already logged-in.
    if user.is_some() {
        return Err(ToastErrorResponse::new(None, "You are already logged in").into());
    }

    sqlx::query(
        r#"
SELECT 1
FROM alpha_invite_codes
WHERE code = $1
"#,
    )
    .bind(&payload.alpha_invite_code)
    .fetch_one(&data.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::FormError(FormErrorResponse::new(
                Some(StatusCode::UNAUTHORIZED),
                vec![("alpha_invite_code", "Invalid or expired invite code")],
            ))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    Ok(HttpResponse::Ok().json(Response { is_valid: true }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        pool::PoolConnection,
        PgPool,
        Postgres,
    };

    async fn get_alpha_invite_code(conn: &mut PoolConnection<Postgres>) -> sqlx::Result<String> {
        sqlx::query(
            r#"
INSERT INTO alpha_invite_codes (code)
VALUES ($1)
"#,
        )
        .bind("0".repeat(8))
        .execute(&mut **conn)
        .await?;

        Ok("0".repeat(8).to_string())
    }

    #[sqlx::test]
    async fn can_handle_an_invite_code_preflight_request_for_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;
        let alpha_invite_code = get_alpha_invite_code(&mut conn).await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/invite-code-preflight")
            .set_json(Request { alpha_invite_code })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(json.unwrap().is_valid);

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_invite_code_preflight_request_for_an_invalid_code(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/auth/invite-code-preflight")
            .set_json(Request {
                alpha_invite_code: "0".repeat(12).to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![("alpha_invite_code", "Invalid or expired invite code")],
        )
        .await;

        Ok(())
    }
}
