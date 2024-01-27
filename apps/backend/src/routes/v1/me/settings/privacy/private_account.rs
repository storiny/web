use crate::{
    constants::account_activity_type::AccountActivityType,
    error::AppError,
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

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    private_account: bool,
}

#[patch("/v1/me/settings/privacy/private-account")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/privacy/private-account",
    skip_all,
    fields(
        user = user.id().ok(),
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    sqlx::query(
        r#"
WITH updated_user AS (
    UPDATE users
    SET is_private = $2
    WHERE id = $1
        -- This check prevents inserting a redundant account activity
        AND is_private <> $2
    RETURNING id
)
INSERT INTO account_activities (type, description, user_id)
SELECT
    $3,
    'You made your account <m>'
         || CASE WHEN $2 IS TRUE
                THEN 'private'
                ELSE 'public'
            END
         || '</m>.',
    id
FROM
    updated_user
"#,
    )
    .bind(user_id)
    .bind(payload.private_account)
    .bind(AccountActivityType::Privacy as i16)
    .execute(&data.db_pool)
    .await?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::init_app_for_test;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_make_an_account_private(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/private-account")
            .set_json(Request {
                private_account: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT is_private FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("is_private"));

        // Should also insert an account activity.
        let result = sqlx::query(
            r#"
SELECT description FROM account_activities
WHERE user_id = $1 AND type = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Privacy as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You made your account <m>private</m>.".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_make_an_account_public(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Make the account private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/private-account")
            .set_json(Request {
                private_account: false,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT is_private FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("is_private"));

        // Should also insert an account activity.
        let result = sqlx::query(
            r#"
SELECT description FROM account_activities
WHERE user_id = $1 AND type = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Privacy as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You made your account <m>public</m>.".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_making_an_already_private_account_as_private(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Make the account private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/private-account")
            .set_json(Request {
                private_account: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        // Should not insert an account activity.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM account_activities
    WHERE user_id = $1 AND type = $2
)
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Privacy as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_making_an_already_public_account_as_public(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Try making the account public.
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/private-account")
            .set_json(Request {
                private_account: false,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        // Should not insert an account activity.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM account_activities
    WHERE user_id = $1 AND type = $2
)
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Privacy as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
