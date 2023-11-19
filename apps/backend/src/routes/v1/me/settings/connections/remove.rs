use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{
    delete,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    connection_id: String,
}

#[delete("/v1/me/settings/connections/{connection_id}")]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.connection_id.parse::<i64>() {
            Ok(connection_id) => {
                match sqlx::query(
                    r#"
                    DELETE FROM connections
                    WHERE id = $1 AND user_id = $2
                    "#,
                )
                .bind(connection_id)
                .bind(user_id)
                .execute(&data.db_pool)
                .await?
                .rows_affected()
                {
                    0 => Ok(HttpResponse::BadRequest()
                        .json(ToastErrorResponse::new("Connection not found"))),
                    _ => Ok(HttpResponse::NoContent().finish()),
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid connection ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
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
    async fn can_remove_a_connection(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false).await;

        // Insert a connection
        let insert_result = sqlx::query(
            r#"
            INSERT INTO connections(provider, provider_identifier, display_name, user_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            "#,
        )
        .bind(0)
        .bind("some-id")
        .bind("Some name")
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/settings/connections/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should be deleted from the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM connections
                WHERE id = $1
            )
            "#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_connection(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/connections/12345")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Connection not found").await;

        Ok(())
    }
}
