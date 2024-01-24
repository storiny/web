use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
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
    id: String,
}

#[delete("/v1/me/collaboration-requests/{id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/collaboration-requests/{id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        id = %path.id
    ),
    err
)]
async fn delete(
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
DELETE FROM story_contributors
WHERE
    user_id = $1
    AND id = $2
    AND accepted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Collaboration request not found").into()),
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
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_reject_a_collaboration_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

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

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/collaboration-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Collaboration request should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_contributors
    WHERE user_id = $1
)
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_return_an_error_response_when_trying_to_reject_an_accepted_collaboration_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Receive an accepted collaboration request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id, accepted_at)
VALUES ($1, $2, NOW())
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
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

    #[sqlx::test]
    async fn can_return_an_error_response_when_trying_to_reject_an_unknown_collaboration_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/collaboration-requests/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Collaboration request not found").await;

        Ok(())
    }
}
