use crate::{
    constants::account_activity_type::AccountActivityType,
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use serde::{
    Deserialize,
    Serialize,
};

use sqlx::FromRow;
use time::{
    format_description,
    OffsetDateTime,
};
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct AccountActivity {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    r#type: i16,
    description: Option<String>,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
}

/// Generates a description for an account activity based on the activity type.
/// If the description is already present, the generation is skipped and the
/// description is return as-is.
///
/// * `activity` - Account activity.
fn get_description_for_activity(activity: &AccountActivity) -> String {
    if activity.description.is_some() {
        return activity.description.clone().unwrap_or_default();
    }

    match AccountActivityType::try_from(activity.r#type) {
        Ok(activity_type) => match activity_type {
            AccountActivityType::AccountCreation => {
                match format_description::parse_owned::<2>("[month repr:short] [day], [year]") {
                    Ok(formatter) => {
                        let creation_str = activity
                            .created_at
                            .format(&formatter)
                            .unwrap_or("Unknown date".to_string());

                        format!("You created this account on {}.", creation_str)
                    }
                    Err(_) => "Unknown activity".to_string(),
                }
            }
            AccountActivityType::DataExport => {
                "You requested a copy of your account data.".to_string()
            }
            _ => activity
                .description
                .clone()
                .unwrap_or("Unknown activity".to_string()),
        },
        Err(_) => "Unknown activity".to_string(),
    }
}

#[get("/v1/me/account-activity")]
#[tracing::instrument(
    name = "GET /v1/me/account-activity",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let page = query.page.unwrap_or(1) - 1;

    let mut result = sqlx::query_as::<_, AccountActivity>(
        r#"
SELECT id, type, description, created_at
FROM account_activities
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
"#,
    )
    .bind(user_id)
    .bind(10_i16)
    .bind((page * 10) as i16)
    .fetch_all(&data.db_pool)
    .await?;

    for item in &mut result {
        item.description = Some(get_description_for_activity(item));
    }

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
    async fn can_return_account_activity(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/account-activity")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<AccountActivity>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let json_data = json.unwrap();
        // By default, the user will have `Account created` activity.
        let creation_activity = &json_data[0];

        // Should return description generated at the application layer.
        assert!(
            creation_activity
                .description
                .clone()
                .unwrap()
                .starts_with("You created this account on")
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_account_activity_with_predefined_description(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert an account activity with a description.
        sqlx::query(
            r#"
INSERT INTO account_activities(type, description, user_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(AccountActivityType::Password as i16)
        .bind("You updated your password")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/account-activity")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<AccountActivity>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let json_data = json.unwrap();
        let password_activity = json_data
            .iter()
            .find(|&item| item.r#type == AccountActivityType::Password as i16)
            .unwrap();

        assert_eq!(
            password_activity.description.clone().unwrap(),
            "You updated your password"
        );

        Ok(())
    }
}
