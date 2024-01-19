use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Response {
    used: bool,
    value: String,
}

#[get("/v1/me/settings/mfa/recovery-codes")]
#[tracing::instrument(
    name = "GET /v1/me/settings/mfa/recovery-codes",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn get(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let result = sqlx::query_as::<_, Response>(
        r#"
SELECT
    code AS "value",
    used_at IS NOT NULL AS "used"
FROM
    mfa_recovery_codes
WHERE
    user_id = $1
ORDER BY
    created_at DESC
LIMIT 10
"#,
    )
    .bind(user_id)
    .fetch_all(&data.db_pool)
    .await?;

    Ok(HttpResponse::Ok().json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_return_recovery_codes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some recovery codes.
        let result = sqlx::query(
            r#"
INSERT INTO mfa_recovery_codes(code, user_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(user_id.unwrap())
        .bind("0".repeat(12))
        .bind("1".repeat(12))
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/recovery-codes")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Response>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
