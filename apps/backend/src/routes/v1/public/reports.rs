use crate::{
    constants::report_type::REPORT_TYPE_VEC,
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
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 0, max = 1024, message = "Invalid reason length"))]
    r#type: String,
    #[validate(length(min = 0, max = 1024, message = "Invalid reason length"))]
    reason: String,
    #[validate(length(min = 1, max = 64, message = "Invalid entity ID"))]
    entity_id: String,
}

#[post("/v1/public/reports")]
async fn post(payload: Json<Request>, data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    let reason = payload.reason.clone();
    let r#type = payload.r#type.clone();

    // Validate story category
    if !REPORT_TYPE_VEC.contains(&r#type) {
        return Ok(HttpResponse::BadRequest().body("Invalid report type"));
    }

    match payload.entity_id.parse::<i64>() {
        Ok(entity_id) => {
            match sqlx::query(
                r#"
                INSERT INTO reports(entity_id, type, reason)
                VALUES ($1, $2, $3)
                "#,
            )
            .bind(entity_id)
            .bind(r#type)
            .bind(reason)
            .execute(&data.db_pool)
            .await?
            .rows_affected()
            {
                0 => Ok(HttpResponse::InternalServerError().finish()),
                _ => Ok(HttpResponse::Created().finish()),
            }
        }
        Err(_) => Ok(HttpResponse::BadRequest().body("Invalid entity ID")),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::report_type::ReportType,
        test_utils::{
            assert_response_body_text,
            init_app_for_test,
        },
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_add_a_report(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/public/reports")
            .set_json(Request {
                r#type: ReportType::Other.to_string(),
                reason: "Report reason".to_string(),
                entity_id: "1".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Report should be present in the database
        let result = sqlx::query(
            r#"
            SELECT reason FROM reports
            WHERE entity_id = $1
            "#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("reason"),
            "Report reason".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_report_for_an_invalid_entity_id(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/public/reports")
            .set_json(Request {
                r#type: ReportType::Other.to_string(),
                reason: "Report reason".to_string(),
                entity_id: "invalid_id".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Invalid entity ID").await;

        Ok(())
    }
}
