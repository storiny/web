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
use lazy_static::lazy_static;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    types::Json,
    FromRow,
    Row,
};
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(recent|old)$").unwrap()
    };
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "SORT_REGEX")]
    sort: Option<String>,
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: Option<String>,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct Tag {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Story {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    title: String,
    slug: Option<String>,
    description: Option<String>,
    splash_id: Option<Uuid>,
    splash_hex: Option<String>,
    category: String,
    age_restriction: i16,
    license: i16,
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    // Stats
    word_count: i32,
    read_count: i32,
    like_count: i32,
    comment_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    published_at: Option<OffsetDateTime>,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    tags: Vec<Tag>,
    user: Json<User>,
    // Boolean flags
    is_liked: bool,
    is_bookmarked: bool,
}

#[get("/v1/me/blogs/{blog_id}/content/pending-stories")]
#[tracing::instrument(
    name = "GET /v1/me/blogs/{blog_id}/content/pending-stories",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id,
        page = query.page,
        sort = query.sort,
        query = query.query
    ),
    err
)]
async fn get(
    path: web::Path<Fragments>,
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let page = query.page.unwrap_or(1) - 1;
    let sort = query.sort.clone().unwrap_or("recent".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let result = sqlx::query(
        r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $1
        AND user_id = $2
        AND deleted_at IS NULL
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $1
        AND user_id = $2
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
)
SELECT COALESCE(
    (SELECT TRUE FROM blog_as_owner),
    (SELECT TRUE FROM blog_as_editor)
) AS "found"
"#,
    )
    .bind(blog_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    if !result.get::<Option<bool>, _>("found").unwrap_or_default() {
        return Err(AppError::from(
            "Missing permission or the blog does not exist",
        ));
    }

    if has_search_query {
        let result = sqlx::query_file_as!(
            Story,
            "queries/me/blogs/pending_stories/with_query.sql",
            search_query,
            blog_id,
            user_id,
            10 as i16,
            (page * 10) as i16
        )
        .fetch_all(&mut *txn)
        .await?;

        txn.commit().await?;

        Ok(HttpResponse::Ok().json(result))
    } else if sort == "old" {
        let result = sqlx::query_file_as!(
            Story,
            "queries/me/blogs/pending_stories/default_asc.sql",
            blog_id,
            user_id,
            10 as i16,
            (page * 10) as i16
        )
        .fetch_all(&mut *txn)
        .await?;

        txn.commit().await?;

        Ok(HttpResponse::Ok().json(result))
    } else {
        let result = sqlx::query_file_as!(
            Story,
            "queries/me/blogs/pending_stories/default_desc.sql",
            blog_id,
            user_id,
            10 as i16,
            (page * 10) as i16
        )
        .fetch_all(&mut *txn)
        .await?;

        txn.commit().await?;

        Ok(HttpResponse::Ok().json(result))
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use urlencoding::encode;

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_pending_stories(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 4);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_pending_stories_for_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Remove all the blog editors.
        sqlx::query(r#" DELETE FROM blog_editors "#)
            .execute(&mut *conn)
            .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should accept the request.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_pending_stories_for_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Remove all the blog editors.
        sqlx::query(r#" DELETE FROM blog_editors "#)
            .execute(&mut *conn)
            .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        // Add the user as editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should still return an error response as the editor invite has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        // Accept the editor invite.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE blog_id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should accept the request.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_pending_stories_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=old",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 8_i64);
        assert_eq!(json[1].id, 5_i64);
        assert_eq!(json[2].id, 4_i64);
        assert_eq!(json[3].id, 7_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_pending_stories_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=recent",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 7_i64);
        assert_eq!(json[1].id, 4_i64);
        assert_eq!(json[2].id, 5_i64);
        assert_eq!(json[3].id, 8_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_search_pending_stories(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?query={}",
                3_i64,
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].title, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn should_not_include_deleted_stories_in_pending_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 4);

        // Soft-delete one of the blog story relations.
        let result = sqlx::query(
            r#"
UPDATE blog_stories
SET deleted_at = NOW()
WHERE story_id = $1
"#,
        )
        .bind(8_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not include the soft-deleted story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(!json.iter().any(|item| item.id == 8_i64));

        // Recover the blog story relation.
        let result = sqlx::query(
            r#"
UPDATE blog_stories
SET deleted_at = NULL
WHERE story_id = $1
"#,
        )
        .bind(8_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/content/pending-stories", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 4);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_is_liked_flag_for_pending_stories_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=old",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(!story.is_liked);

        // Publish the story if it is a draft.
        sqlx::query(
            r#"
UPDATE stories
SET
    published_at = NOW(),
    first_published_at = NOW()
WHERE
    id = $1
    AND published_at IS NULL
"#,
        )
        .bind(story.id)
        .execute(&mut *conn)
        .await?;

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(story.id)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=old",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_is_bookmarked_flag_for_pending_stories_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=old",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(!story.is_bookmarked);

        // Publish the story if it is a draft.
        sqlx::query(
            r#"
UPDATE stories
SET
    published_at = NOW(),
    first_published_at = NOW()
WHERE
    id = $1
    AND published_at IS NULL
"#,
        )
        .bind(story.id)
        .execute(&mut *conn)
        .await?;

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(story.id)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=old",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_is_liked_flag_for_pending_stories_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=recent",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(!story.is_liked);

        // Publish the story if it is a draft.
        sqlx::query(
            r#"
UPDATE stories
SET
    published_at = NOW(),
    first_published_at = NOW()
WHERE
    id = $1
    AND published_at IS NULL
"#,
        )
        .bind(story.id)
        .execute(&mut *conn)
        .await?;

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(story.id)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=recent",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_is_bookmarked_flag_for_pending_stories_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=recent",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(!story.is_bookmarked);

        // Publish the story if it is a draft.
        sqlx::query(
            r#"
UPDATE stories
SET
    published_at = NOW(),
    first_published_at = NOW()
WHERE
    id = $1
    AND published_at IS NULL
"#,
        )
        .bind(story.id)
        .execute(&mut *conn)
        .await?;

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(story.id)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?sort=recent",
                3_i64
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_is_liked_flag_for_pending_stories_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?query={}",
                3_i64,
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(!story.is_liked);

        // Publish the story if it is a draft.
        sqlx::query(
            r#"
UPDATE stories
SET
    published_at = NOW(),
    first_published_at = NOW()
WHERE
    id = $1
    AND published_at IS NULL
"#,
        )
        .bind(story.id)
        .execute(&mut *conn)
        .await?;

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(story.id)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?query={}",
                3_i64,
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test(fixtures("pending_story"))]
    async fn can_return_is_bookmarked_flag_for_pending_stories_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?query={}",
                3_i64,
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(!story.is_bookmarked);

        // Publish the story if it is a draft.
        sqlx::query(
            r#"
UPDATE stories
SET
    published_at = NOW(),
    first_published_at = NOW()
WHERE
    id = $1
    AND published_at IS NULL
"#,
        )
        .bind(story.id)
        .execute(&mut *conn)
        .await?;

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(story.id)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/content/pending-stories?query={}",
                3_i64,
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert!(story.is_bookmarked);

        Ok(())
    }
}
