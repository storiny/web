use crate::{
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
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Blog {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    slug: String,
    domain: Option<String>,
    description: Option<String>,
    logo_id: Option<Uuid>,
    logo_hex: Option<String>,
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    // Boolean flags
    is_active: bool,
    is_owner: bool,
    is_editor: bool,
    is_writer: bool,
}

#[get("/v1/me/blogs")]
#[tracing::instrument(
    name = "GET /v1/me/blogs",
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

    let result = sqlx::query_as::<_, Blog>(
        r#"
WITH user_blogs AS (
    (
        SELECT
            id,
            name,
            slug,
            domain,
            description,
            logo_id,
            logo_hex,
            user_id,
            -- Stats
            follower_count,
            -- Timestamps
            created_at,
            -- Boolean flags
            is_active,
            TRUE AS "is_owner",
            FALSE AS "is_editor",
            FALSE AS "is_writer"
        FROM
            blogs
        WHERE
            user_id = $1
            AND deleted_at IS NULL
    --
    UNION ALL
    --
        SELECT
            b.id,
            b.name,
            b.slug,
            b.domain,
            b.description,
            b.logo_id,
            b.logo_hex,
            b.user_id,
            -- Stats
            b.follower_count,
            -- Timestamps
            b.created_at,
            -- Boolean flags
            is_active,
            FALSE AS "is_owner",
            TRUE AS "is_editor",
            FALSE AS "is_writer"
        FROM blog_editors AS be
            INNER JOIN blogs AS b
                ON be.blog_id = b.id
        WHERE
            be.user_id = $1
            AND be.accepted_at IS NOT NULL
            AND be.deleted_at IS NULL
    --
    UNION ALL
    --
        SELECT
            b.id,
            b.name,
            b.slug,
            b.domain,
            b.description,
            b.logo_id,
            b.logo_hex,
            b.user_id,
            -- Stats
            b.follower_count,
            -- Timestamps
            b.created_at,
            -- Boolean flags
            is_active,
            FALSE AS "is_owner",
            FALSE AS "is_editor",
            TRUE AS "is_writer"
        FROM blog_writers AS bw
            INNER JOIN blogs AS b
                ON bw.blog_id = b.id
        WHERE
            bw.receiver_id = $1
            AND bw.accepted_at IS NOT NULL
            AND bw.deleted_at IS NULL
    )
    ORDER BY
        follower_count DESC,
        created_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    name,
    slug,
    domain,
    description,
    logo_id,
    logo_hex,
    user_id,
    -- Timestamps
    created_at,
    -- Boolean flags
    is_active,
    is_owner,
    is_editor,
    is_writer
FROM user_blogs
    "#,
    )
    .bind(user_id)
    .bind(10_i16)
    .bind((page * 10) as i16)
    .fetch_all(&data.db_pool)
    .await?;

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
    async fn can_return_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
), inserted_blogs AS (
    INSERT INTO blogs (id, name, slug, user_id)
    VALUES
        (1, 'Sample blog 1', 'sample-blog-1', (SELECT id FROM inserted_user)),
        (2, 'Sample blog 2', 'sample-blog-2', (SELECT id FROM inserted_user))
), inserted_self_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Sample blog 3', 'sample-blog-3', $1)
), inserted_editor AS (
    INSERT INTO blog_editors (user_id, blog_id, accepted_at)
    VALUES ($1, 1, NOW())
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id, accepted_at)
VALUES ((SELECT id FROM inserted_user), $1, 2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert_eq!(
            json.iter()
                .filter(|item| item.is_owner)
                .collect::<Vec<_>>()
                .len(),
            1
        );
        assert_eq!(
            json.iter()
                .filter(|item| item.is_editor)
                .collect::<Vec<_>>()
                .len(),
            1
        );
        assert_eq!(
            json.iter()
                .filter(|item| item.is_writer)
                .collect::<Vec<_>>()
                .len(),
            1
        );

        Ok(())
    }

    // Owner

    #[sqlx::test]
    async fn can_return_is_owner_flag_for_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES
    ('Sample blog 1', 'sample-blog-1', $1),
    ('Sample blog 2', 'sample-blog-2', $1),
    ('Sample blog 3', 'sample-blog-3', $1)
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(
            json.iter()
                .all(|item| item.is_owner && !item.is_editor && !item.is_writer)
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_deleted_self_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES
    ('Sample blog 1', 'sample-blog-1', $1),
    ('Sample blog 2', 'sample-blog-2', $1),
    ('Sample blog 3', 'sample-blog-3', $1)
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should return all the blogs initially.
        assert_eq!(json.len(), 3);

        // Soft-delete one of the blogs.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE slug = $1
"#,
        )
        .bind("sample-blog-1".to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should only return two blogs.
        assert_eq!(json.len(), 2);
        assert!(json.iter().all(|item| item.slug != "sample-blog-1"));

        Ok(())
    }

    // Editor

    #[sqlx::test]
    async fn can_return_is_editor_flag_for_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
), inserted_blogs AS (
    INSERT INTO blogs (id, name, slug, user_id)
    VALUES
        (1, 'Sample blog 1', 'sample-blog-1', (SELECT id FROM inserted_user)),
        (2, 'Sample blog 2', 'sample-blog-2', (SELECT id FROM inserted_user)),
        (3, 'Sample blog 3', 'sample-blog-3', (SELECT id FROM inserted_user))
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES
    ($1, 1, NOW()),
    ($1, 2, NOW()),
    ($1, 3, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(
            json.iter()
                .all(|item| item.is_editor && !item.is_owner && !item.is_writer)
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_deleted_editor_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
), inserted_blogs AS (
    INSERT INTO blogs (id, name, slug, user_id)
    VALUES
        (1, 'Sample blog 1', 'sample-blog-1', (SELECT id FROM inserted_user)),
        (2, 'Sample blog 2', 'sample-blog-2', (SELECT id FROM inserted_user)),
        (3, 'Sample blog 3', 'sample-blog-3', (SELECT id FROM inserted_user))
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES
    ($1, 1, NOW()),
    ($1, 2, NOW()),
    ($1, 3, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should return all the blogs initially.
        assert_eq!(json.len(), 3);

        // Soft-delete one of the blogs.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE slug = $1
"#,
        )
        .bind("sample-blog-1".to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should only return two blogs.
        assert_eq!(json.len(), 2);
        assert!(json.iter().all(|item| item.slug != "sample-blog-1"));

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_pending_editor_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
), inserted_blogs AS (
    INSERT INTO blogs (id, name, slug, user_id)
    VALUES
        (1, 'Sample blog 1', 'sample-blog-1', (SELECT id FROM inserted_user)),
        (2, 'Sample blog 2', 'sample-blog-2', (SELECT id FROM inserted_user)),
        (3, 'Sample blog 3', 'sample-blog-3', (SELECT id FROM inserted_user))
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES
    ($1, 1),
    ($1, 2),
    ($1, 3)
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should not return any blogs initially.
        assert!(json.is_empty());

        // Accept the editor requests.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should return all the blogs.
        assert_eq!(json.len(), 3);

        Ok(())
    }

    // Writer

    #[sqlx::test]
    async fn can_return_is_writer_flag_for_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
), inserted_blogs AS (
    INSERT INTO blogs (id, name, slug, user_id)
    VALUES
        (1, 'Sample blog 1', 'sample-blog-1', (SELECT id FROM inserted_user)),
        (2, 'Sample blog 2', 'sample-blog-2', (SELECT id FROM inserted_user)),
        (3, 'Sample blog 3', 'sample-blog-3', (SELECT id FROM inserted_user))
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id, accepted_at)
VALUES
    ((SELECT id FROM inserted_user), $1, 1, NOW()),
    ((SELECT id FROM inserted_user), $1, 2, NOW()),
    ((SELECT id FROM inserted_user), $1, 3, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(
            json.iter()
                .all(|item| !item.is_editor && !item.is_owner && item.is_writer)
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_deleted_writer_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
), inserted_blogs AS (
    INSERT INTO blogs (id, name, slug, user_id)
    VALUES
        (1, 'Sample blog 1', 'sample-blog-1', (SELECT id FROM inserted_user)),
        (2, 'Sample blog 2', 'sample-blog-2', (SELECT id FROM inserted_user)),
        (3, 'Sample blog 3', 'sample-blog-3', (SELECT id FROM inserted_user))
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id, accepted_at)
VALUES
    ((SELECT id FROM inserted_user), $1, 1, NOW()),
    ((SELECT id FROM inserted_user), $1, 2, NOW()),
    ((SELECT id FROM inserted_user), $1, 3, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should return all the blogs initially.
        assert_eq!(json.len(), 3);

        // Soft-delete one of the blogs.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE slug = $1
"#,
        )
        .bind("sample-blog-1".to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should only return two blogs.
        assert_eq!(json.len(), 2);
        assert!(json.iter().all(|item| item.slug != "sample-blog-1"));

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_pending_writer_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert blogs.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
), inserted_blogs AS (
    INSERT INTO blogs (id, name, slug, user_id)
    VALUES
        (1, 'Sample blog 1', 'sample-blog-1', (SELECT id FROM inserted_user)),
        (2, 'Sample blog 2', 'sample-blog-2', (SELECT id FROM inserted_user)),
        (3, 'Sample blog 3', 'sample-blog-3', (SELECT id FROM inserted_user))
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES
    ((SELECT id FROM inserted_user), $1, 1),
    ((SELECT id FROM inserted_user), $1, 2),
    ((SELECT id FROM inserted_user), $1, 3)
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should not return any blogs initially.
        assert!(json.is_empty());

        // Accept the writer requests.
        let result = sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blogs")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Blog>>(&res_to_string(res).await).unwrap();

        // Should return all the blogs.
        assert_eq!(json.len(), 3);

        Ok(())
    }
}
