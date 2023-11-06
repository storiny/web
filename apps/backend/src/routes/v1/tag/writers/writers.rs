use crate::{
    error::AppError, middleware::identity::identity::Identity, models::tag::TAG_REGEX, AppState,
};
use actix_web::{get, web, HttpResponse};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Postgres, QueryBuilder};
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    tag_name: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Writer {
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
    // Boolean flags
    is_following: bool,
}

#[get("/v1/tag/{tag_name}/writers")]
async fn get(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let mut user_id: Option<i64> = None;

    // Validate tag name
    if !TAG_REGEX.is_match(&path.tag_name) {
        return Ok(HttpResponse::BadRequest().body("Invalid tag name"));
    }

    if let Some(user) = maybe_user {
        match user.id() {
            Ok(id) => {
                user_id = Some(id);
            }
            Err(_) => return Ok(HttpResponse::InternalServerError().finish()),
        }
    }

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
        WITH tag_writers AS (
        "#,
    );

    query_builder.push(
        r#"
        SELECT
            -- User
            u.id,
            u.name,
            u.username,
            u.avatar_id,
            u.avatar_hex,
            u.public_flags,
        "#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
        -- Boolean flags
        CASE
            WHEN COUNT("u->is_following") = 1
                THEN
                    TRUE
                ELSE
                    FALSE
        END AS "is_following"
        "#
    } else {
        r#"FALSE as "is_following""#
    });

    query_builder.push(
        r#"
        FROM
            users AS u
                -- Join story
                INNER JOIN stories AS "u->story"
                    ON "u->story".user_id = u.id
                        AND "u->story".visibility = 2
                        AND "u->story".published_at IS NOT NULL
                        AND "u->story".deleted_at IS NULL
                -- Join story tags
                INNER JOIN (story_tags AS "u->story->story_tags"
                    -- Join tags
                    INNER JOIN tags AS "u->story->story_tags->tag"
                        ON "u->story->story_tags->tag".id = "u->story->story_tags".tag_id
                        AND "u->story->story_tags->tag".name = $1)
                    ON "u->story->story_tags".story_id = "u->story".id
        "#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
            -- Boolean following flag
            LEFT OUTER JOIN relations AS "u->is_following"
                ON "u->is_following".followed_id = u.id
                    AND "u->is_following".follower_id = $2
                    AND "u->is_following".deleted_at IS NULL
            "#,
        );
    }

    query_builder.push(
        r#"
            WHERE
                u.deactivated_at IS NULL
                AND u.deleted_at IS NULL
                AND u.is_private IS FALSE
              GROUP BY
                  u.id
            ORDER BY
                  u.follower_count DESC
            LIMIT 5
        )
        SELECT
            -- User
            id,
            name,
            username,
            avatar_id,
            avatar_hex,
            public_flags,
            -- Boolean flags
            is_following
        FROM tag_writers
        "#,
    );

    let mut db_query = query_builder
        .build_query_as::<Writer>()
        .bind(&path.tag_name);

    if user_id.is_some() {
        db_query = db_query.bind(user_id.unwrap());
    }

    let result = db_query.fetch_all(&data.db_pool).await?;

    Ok(HttpResponse::Ok().json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{assert_response_body_text, init_app_for_test, res_to_string};
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_reject_invalid_tag_name(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false).await.0;

        let req = test::TestRequest::get()
            .uri("/v1/tag/@invalid_tag_name/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Invalid tag name").await;

        Ok(())
    }

    // Logged-out

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_tag_writers(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false).await.0;

        let req = test::TestRequest::get()
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_soft_deleted_writers_in_tag_writers(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false).await.0;

        // Should return all the writers initially
        let req = test::TestRequest::get()
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Soft-delete one of the writers
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers
        let req = test::TestRequest::get()
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover the soft-deleted writer
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again
        let req = test::TestRequest::get()
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deactivated_writers_in_tag_writers(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false).await.0;

        // Should return all the writers initially
        let req = test::TestRequest::get()
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Deactivate one of the writers
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers
        let req = test::TestRequest::get()
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Reactivate the deactivated writer
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again
        let req = test::TestRequest::get()
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_tag_writers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_soft_deleted_writers_in_tag_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true).await;

        // Should return all the writers initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Soft-delete one of the writers
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover the soft-deleted writer
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deactivated_writers_in_tag_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true).await;

        // Should return all the writers initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Deactivate one of the writers
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Reactivate the deactivated writer
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/tag/tag-1/writers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }
}
