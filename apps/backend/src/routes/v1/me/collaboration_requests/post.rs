use crate::{
    constants::notification_entity_type::NotificationEntityType,
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    id: String,
}

#[post("/v1/me/collaboration-requests/{id}")]
#[tracing::instrument(
    name = "POST /v1/me/collaboration-requests/{id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        id = %path.id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let id = path
        .id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid ID"))?;

    match sqlx::query(
        r#"                    
WITH
    updated_contributor AS (
        UPDATE story_contributors
        SET accepted_at = NOW()
        WHERE
            id = $1
            AND user_id = $2
            AND accepted_at IS NULL
            AND deleted_at IS NULL
        RETURNING story_id
    ),
    inserted_notification AS (
        INSERT INTO notifications (entity_type, entity_id, notifier_id)
        SELECT $3, $1, $2
        WHERE EXISTS (SELECT 1 FROM updated_contributor)
        RETURNING id
    )
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    (
        SELECT user_id FROM stories
        WHERE id = (
            SELECT story_id
            FROM updated_contributor
        )
    ),
    (SELECT id FROM inserted_notification)
WHERE EXISTS (SELECT 1 FROM inserted_notification)
"#,
    )
    .bind(id)
    .bind(user_id)
    .bind(NotificationEntityType::CollabReqAccept as i16)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Collaboration request not found").into()),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
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
    use time::OffsetDateTime;

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_accept_a_collaboration_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a collaboration request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/collaboration-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Collaboration request should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT accepted_at FROM story_contributors
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("accepted_at")
                .is_some()
        );

        // Should also insert a notification.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_accept_a_soft_deleted_collaboration_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a soft-deleted collaboration request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id, deleted_at)
VALUES ($1, $2, NOW())
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Try accepting the collaboration request.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/collaboration-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Collaboration request not found").await;

        // Recover the collaboration request.
        let result = sqlx::query(
            r#"
UPDATE story_contributors
SET deleted_at = NULL
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try accepting the collaboration request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/collaboration-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_accept_an_already_accepted_collaboration_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a collaboration request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Accept the collaboration request for the first time.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/collaboration-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try accepting the collaboration request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/collaboration-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Collaboration request not found").await;

        Ok(())
    }
}
