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
    delete,
    web,
    HttpResponse,
};
use lockable::AsyncLimit;
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[delete("/v1/me/stories/{story_id}")]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
    realm_map: RealmData,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.story_id.parse::<i64>() {
            Ok(story_id) => {
                if let Ok(mut realm) = realm_map.async_lock(story_id, AsyncLimit::no_limit()).await
                {
                    match sqlx::query(
                        r#"
                        UPDATE stories
                        SET
                            deleted_at = now(),
                            published_at = NULL
                        WHERE
                            user_id = $1
                            AND id = $2
                            AND published_at IS NOT NULL
                            AND deleted_at IS NULL
                        "#,
                    )
                    .bind(user_id)
                    .bind(story_id)
                    .execute(&data.db_pool)
                    .await?
                    .rows_affected()
                    {
                        0 => Ok(HttpResponse::BadRequest()
                            .json(ToastErrorResponse::new("Story not found"))),
                        _ => {
                            // Drop the realm
                            if let Some(realm_inner) = realm.value() {
                                realm_inner.destroy(RealmDestroyReason::StoryDeleted).await;
                            }

                            realm.remove();

                            Ok(HttpResponse::NoContent().finish())
                        }
                    }
                } else {
                    return Ok(HttpResponse::InternalServerError().finish());
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
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
    use time::OffsetDateTime;

    #[sqlx::test]
    async fn can_remove_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a published story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, published_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get soft-deleted and unpublished
        let result = sqlx::query(
            r#"
            SELECT deleted_at, published_at FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("published_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_delete_a_draft(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a draft
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_deleting_an_unknown_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }
}
