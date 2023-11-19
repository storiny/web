use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middleware::identity::identity::Identity,
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
use sqlx::Row;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    banner_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    banner_id: Option<Uuid>,
    banner_hex: Option<String>,
}

#[patch("/v1/me/settings/banner")]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            if payload.banner_id.is_none() {
                sqlx::query(
                    r#"
                    UPDATE users
                    SET
                        banner_id = NULL,
                        banner_hex = NULL
                    WHERE id = $1
                    "#,
                )
                .bind(user_id)
                .execute(&data.db_pool)
                .await?;

                Ok(HttpResponse::NoContent().json(Response {
                    banner_id: None,
                    banner_hex: None,
                }))
            } else {
                match sqlx::query(
                    r#"
                    WITH
                        asset AS (SELECT key, hex
                                  FROM assets
                                  WHERE key = $2
                                    AND user_id = $1
                                  LIMIT 1
                        )
                    UPDATE users
                    SET
                        banner_id  = (SELECT key FROM asset),
                        banner_hex = (SELECT hex FROM asset)
                    WHERE
                        id = $1
                        AND (SELECT key FROM asset) IS NOT NULL
                    RETURNING banner_id, banner_hex
                    "#,
                )
                .bind(user_id)
                .bind(&payload.banner_id)
                .fetch_one(&data.db_pool)
                .await
                {
                    Ok(row) => Ok(HttpResponse::NoContent().json(Response {
                        banner_id: row.get::<Option<Uuid>, _>("banner_id"),
                        banner_hex: row.get::<Option<String>, _>("banner_hex"),
                    })),
                    Err(kind) => match kind {
                        sqlx::Error::RowNotFound => Ok(HttpResponse::BadRequest()
                            .json(ToastErrorResponse::new("Invalid banner ID"))),
                        _ => Ok(HttpResponse::InternalServerError().finish()),
                    },
                }
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
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
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_set_a_banner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false).await;
        let banner_id = Uuid::new_v4();

        // Insert an asset
        let result = sqlx::query(
            r#"
            INSERT INTO assets(key, hex, height, width, user_id) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
        )
        .bind(&banner_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/banner")
            .set_json(Request {
                banner_id: Some(banner_id),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert_eq!(json.banner_id, Some(banner_id));
        assert_eq!(json.banner_hex, Some("000000".to_string()));

        // Banner should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT banner_id, banner_hex FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<Option<Uuid>, _>("banner_id").unwrap(),
            banner_id
        );
        assert_eq!(
            result.get::<Option<String>, _>("banner_hex").unwrap(),
            "000000".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_remove_a_banner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false).await;
        let banner_id = Uuid::new_v4();

        // Insert an asset
        let result = sqlx::query(
            r#"
            INSERT INTO assets(key, hex, height, width, user_id) 
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(&banner_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Set banner for the user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET banner_id = $1,
                banner_hex = $2
            WHERE id = $3
            RETURNING banner_id, banner_hex
            "#,
        )
        .bind(&banner_id)
        .bind("000000".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<Option<Uuid>, _>("banner_id").unwrap(),
            banner_id
        );
        assert_eq!(
            result.get::<Option<String>, _>("banner_hex").unwrap(),
            "000000".to_string()
        );

        // Reset the banner
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/banner")
            .set_json(Request { banner_id: None })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(json.banner_id.is_none());
        assert!(json.banner_hex.is_none());

        // Banner should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT banner_id, banner_hex FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<Uuid>, _>("banner_id").is_none());
        assert!(result.get::<Option<String>, _>("banner_hex").is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_for_an_invalid_banner_id(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/banner")
            .set_json(Request {
                banner_id: Some(Uuid::new_v4()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid banner ID").await;

        Ok(())
    }
}
