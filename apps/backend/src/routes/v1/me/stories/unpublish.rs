use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    realms::realm::{
        RealmData,
        RealmDestroyReason,
    },
    AppState,
};
use actix_web::{
    post,
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
}

#[post("/v1/me/stories/{story_id}/unpublish")]
#[tracing::instrument(
    name = "POST /v1/me/stories/{story_id}/unpublish",
    skip_all,
    fields(
        user_id = user.id().ok(),
        story_id = %path.story_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
    realm_map: RealmData,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let mut realm = realm_map
        .async_lock(story_id, AsyncLimit::no_limit())
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to acquire a lock on the realm: {error:?}"))
        })?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
UPDATE stories
SET
    published_at = NULL,
    first_published_at = NULL
WHERE
    user_id = $1
    AND id = $2
    AND published_at IS NOT NULL
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Story not found").into()),
        _ => {
            // Drop the realm.
            if let Some(realm_inner) = realm.value() {
                debug!("realm is present in the map, destroying");

                realm_inner
                    .destroy(RealmDestroyReason::StoryUnpublished)
                    .await;
            }

            realm.remove();

            txn.commit().await?;

            Ok(HttpResponse::NoContent().finish())
        }
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

    #[sqlx::test]
    async fn can_unpublish_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a published story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, published_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/unpublish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT
    published_at,
    first_published_at
FROM stories
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("published_at")
                .is_none()
        );
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("first_published_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_unpublish_a_draft(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a draft.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/unpublish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_unpublish_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a soft-deleted story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, deleted_at, published_at)
VALUES ($1, $2, NOW(), NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/unpublish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_an_unknown_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/unpublish", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }
}
