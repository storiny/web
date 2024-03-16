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
use sqlx::{
    types::Json,
    FromRow,
    Postgres,
    QueryBuilder,
};
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Blog {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    slug: String,
    domain: Option<String>,
    logo_id: Option<Uuid>,
    logo_hex: Option<String>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct BlogRequest {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    role: String,
    // Joins
    blog: Json<Blog>,
}

#[get("/v1/me/blog-requests")]
#[tracing::instrument(
    name = "GET /v1/me/blog-requests",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
        query = query.query
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
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new("");

    query_builder.push(if has_search_query {
        r#"
WITH search_query AS (
    SELECT PLAINTO_TSQUERY('english', $4) AS tsq
), requests AS (
"#
    } else {
        r#" WITH requests AS ( "#
    });

    query_builder.push(
        r#"
(
    SELECT
        be.id,
        be.created_at,
        'editor' AS "role",
        -- Blog
        JSON_BUILD_OBJECT(
            'id', "be->blog".id,
            'name', "be->blog".name,
            'slug', "be->blog".slug,
            'domain', "be->blog".domain,
            'logo_id', "be->blog".logo_id,
            'logo_hex', "be->blog".logo_hex
        ) AS "blog"
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD("be->blog".search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    blog_editors AS be
        INNER JOIN blogs AS "be->blog"
            ON be.blog_id = "be->blog".id
            AND "be->blog".user_id IS NOT NULL
WHERE
    be.user_id = $1
    AND be.accepted_at IS NULL
    AND be.deleted_at IS NULL
"#,
    );

    if has_search_query {
        query_builder.push(r#" AND "be->blog".search_vec @@ (SELECT tsq FROM search_query) "#);
    }

    query_builder.push(
        r#"
--
UNION ALL
--
SELECT
    bw.id,
    bw.created_at,
    'writer' AS "role",
    -- Blog
    JSON_BUILD_OBJECT(
        'id', "bw->blog".id,
        'name', "bw->blog".name,
        'slug', "bw->blog".slug,
        'domain', "bw->blog".domain,
        'logo_id', "bw->blog".logo_id,
        'logo_hex', "bw->blog".logo_hex
    ) AS "blog"
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD("bw->blog".search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    blog_writers AS bw
        INNER JOIN blogs AS "bw->blog"
            ON bw.blog_id = "bw->blog".id
            AND "bw->blog".user_id IS NOT NULL
WHERE
    bw.receiver_id = $1
    AND bw.accepted_at IS NULL
    AND bw.deleted_at IS NULL
"#,
    );

    if has_search_query {
        query_builder.push(r#" AND "bw->blog".search_vec @@ (SELECT tsq FROM search_query) "#);
    }

    query_builder.push(
        r#"
)
ORDER BY
"#,
    );

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(
        r#"
        created_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    role,
    created_at,
    blog
FROM requests
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<BlogRequest>()
        .bind(user_id)
        .bind(10_i16)
        .bind((page * 10) as i16);

    if has_search_query {
        db_query = db_query.bind(search_query);
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
    use crate::test_utils::{
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    // Received

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_return_received_collaboration_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some collaboration requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/collaboration-requests?type=received")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_include_soft_deleted_requests_in_received_collaboration_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some collaboration requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the collaboration requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=received")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the collaboration request.
        let result = sqlx::query(
            r#"
UPDATE story_contributors
SET deleted_at = NOW()
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one collaboration request.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=received")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the collaboration request.
        let result = sqlx::query(
            r#"
UPDATE story_contributors
SET deleted_at = NULL
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the collaboration requests again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/collaboration-requests?type=received")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_include_accepted_requests_in_received_collaboration_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some collaboration requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the collaboration requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=received")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Accept one of the collaboration request.
        let result = sqlx::query(
            r#"
UPDATE story_contributors
SET accepted_at = NOW()
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one collaboration request.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=received")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    // Sent

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_return_sent_collaboration_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        // Send some collaboration requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/collaboration-requests?type=sent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_return_sent_collaboration_requests_with_soft_deleted_users(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        // Send a collaboration request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Soft-delete the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/collaboration-requests?type=sent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json =
            serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(json[0].user.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_return_sent_collaboration_requests_with_deactivated_users(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        // Send a collaboration request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Deactivate the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/collaboration-requests?type=sent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json =
            serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(json[0].user.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_include_requests_with_soft_deleted_story_in_sent_collaboration_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a story.
        let story_result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        // Send some collaboration requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the collaboration requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=sent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any collaboration request.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=sent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(json.unwrap().is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_include_accepted_requests_in_sent_collaboration_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        // Send some collaboration requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the collaboration requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=sent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Accept one of the collaboration request.
        let result = sqlx::query(
            r#"
UPDATE story_contributors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one collaboration request.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/collaboration-requests?type=sent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<CollaborationRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }
}
