use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    realms::realm::RealmData,
    AppState,
};
use actix_web::{
    delete,
    web,
    HttpResponse,
};
use lockable::AsyncLimit;
use serde::Deserialize;
use tracing::debug;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
    user_id: String,
}

#[delete("/v1/me/stories/{story_id}/contributors/{user_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/stories/{story_id}/contributors/{user_id}",
    skip_all,
    fields(
        current_user_id = user.id().ok(),
        story_id = %path.story_id,
        contributor_user_id = %path.user_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
    realm_map: RealmData,
) -> Result<HttpResponse, AppError> {
    let current_user_id = user.id()?;

    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let contributor_user_id = path
        .user_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    let realm = realm_map
        .async_lock(story_id, AsyncLimit::no_limit())
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to acquire a lock on the realm: {error:?}"))
        })?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
DELETE FROM story_contributors sc
USING stories s
WHERE
    s.id = $3
    AND s.user_id = $1
    AND s.deleted_at IS NULL
    AND sc.story_id = s.id
    AND sc.user_id = $2
"#,
    )
    .bind(current_user_id)
    .bind(contributor_user_id)
    .bind(story_id)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Contributor not found")),
        _ => {
            // Remove the peer from the realm.
            if let Some(realm_inner) = realm.value() {
                debug!("realm is present in the map, removing the peer");
                realm_inner.remove_peer(contributor_user_id, false).await;
            }

            txn.commit().await?;

            Ok(HttpResponse::NoContent().finish())
        }
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

    #[sqlx::test(fixtures("contributor"))]
    async fn can_remove_a_contributor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        // Add a contributor.
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/contributors/{}", 3, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Contributor should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_contributors
    WHERE user_id = $1 AND story_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_return_an_error_response_when_removing_an_unknown_contributor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/contributors/{}", 3, 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Contributor not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_return_an_error_response_for_a_missing_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/contributors/{}", 12345, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Contributor not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_return_an_error_response_for_a_soft_deleted_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/contributors/{}", 3, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Contributor not found").await;

        Ok(())
    }
}
