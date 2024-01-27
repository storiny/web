use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    realms::realm::{
        PeerRole,
        RealmData,
    },
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use lazy_static::lazy_static;
use lockable::AsyncLimit;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};
use tracing::debug;
use validator::Validate;

lazy_static! {
    static ref ROLE_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(editor|viewer)$").unwrap()
    };
}

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
    user_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "ROLE_REGEX")]
    role: String,
}

#[patch("/v1/me/stories/{story_id}/contributors/{user_id}")]
#[tracing::instrument(
    name = "PATCH /v1/me/stories/{story_id}/contributors/{user_id}",
    skip_all,
    fields(
        current_user_id = user.id().ok(),
        story_id = %path.story_id,
        contributor_user_id = %path.user_id,
        payload
    ),
    err
)]
async fn patch(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    payload: Json<Request>,
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
WITH target_story AS (
    SELECT id FROM stories
    WHERE
        id = $3
        AND user_id = $1
        AND deleted_at IS NULL
)
UPDATE story_contributors
SET role = $4
WHERE
    user_id = $2
    AND story_id = (SELECT id FROM target_story)
"#,
    )
    .bind(current_user_id)
    .bind(contributor_user_id)
    .bind(story_id)
    .bind(&payload.role)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Contributor not found")),
        _ => {
            // Update the peer in the realm.
            if let Some(realm_inner) = realm.value() {
                debug!("realm is present in the map, updating");

                realm_inner
                    .update_peer_role(
                        contributor_user_id,
                        if payload.role == *"viewer" {
                            PeerRole::Viewer
                        } else {
                            PeerRole::Editor
                        },
                    )
                    .await;
            }

            txn.commit().await?;

            Ok(HttpResponse::NoContent().finish())
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
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
    async fn can_update_a_contributor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Add a contributor.
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING role
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("role"), "editor".to_string());

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "viewer".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors/{}", 3, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Contributor should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT role FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("role"), "viewer".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_return_an_error_response_when_updating_an_unknown_contributor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "viewer".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors/{}", 3, 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Contributor not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_return_an_error_response_for_a_missing_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "viewer".to_string(),
            })
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
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

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

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "viewer".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors/{}", 3, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Contributor not found").await;

        Ok(())
    }
}
