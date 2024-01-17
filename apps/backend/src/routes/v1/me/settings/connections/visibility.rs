use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    connection_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    hidden: bool,
}

#[patch("/v1/me/settings/connections/{connection_id}/visibility")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/connections/{connection_id}/visibility",
    skip_all,
    fields(
        user = user.id().ok(),
        connection_id = %path.connection_id,
        hidden = %payload.hidden
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let connection_id = path
        .connection_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid connection ID"))?;

    match sqlx::query(
        r#"
UPDATE connections
SET hidden = $3
WHERE
    id = $1
    AND user_id = $2
"#,
    )
    .bind(connection_id)
    .bind(user_id)
    .bind(payload.hidden)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Connection not found").into()),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
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

    #[sqlx::test]
    async fn can_update_connection_visibility(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a connection.
        let insert_result = sqlx::query(
            r#"
INSERT INTO connections (provider, provider_identifier, display_name, user_id)
VALUES ($1, $2, $3, $4)
RETURNING id, hidden
"#,
        )
        .bind(0)
        .bind("some-id")
        .bind("Some name")
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(!insert_result.get::<bool, _>("hidden"));

        let connection_id = insert_result.get::<i64, _>("id");

        // Set hidden to `true`
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/settings/connections/{}/visibility",
                connection_id
            ))
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT hidden FROM connections
WHERE id = $1
"#,
        )
        .bind(connection_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("hidden"));

        // Set hidden to `false`
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/settings/connections/{}/visibility",
                connection_id
            ))
            .set_json(Request { hidden: false })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT hidden FROM connections
WHERE id = $1
"#,
        )
        .bind(connection_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("hidden"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_connection(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/connections/12345/visibility")
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Connection not found").await;

        Ok(())
    }
}
