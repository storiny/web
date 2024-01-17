use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
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
    transmitter_or_receiver_id: String,
}

#[delete("/v1/me/friends/{transmitter_or_receiver_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/friends/{transmitter_or_receiver_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        transmitter_or_receiver_id = %path.transmitter_or_receiver_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let transmitter_or_receiver_id = path
        .transmitter_or_receiver_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    match sqlx::query(
        r#"
DELETE FROM friends
WHERE
    (
        (transmitter_id = $1 AND receiver_id = $2)
        OR
        (transmitter_id = $2 AND receiver_id = $1)
    )
    AND accepted_at IS NOT NULL
"#,
    )
    .bind(user_id)
    .bind(transmitter_or_receiver_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Friend not found")),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("friend"))]
    async fn can_remove_a_friend(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Add a friend.
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Friend should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE transmitter_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_removing_an_unknown_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friends/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Friend not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_remove_a_pending_friend(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Add a pending friend.
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not remove the friend request.
        let req = test::TestRequest::delete()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Friend not found").await;

        // Accept the friend request.
        let result = sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should remove the accepted friend now.
        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }
}
