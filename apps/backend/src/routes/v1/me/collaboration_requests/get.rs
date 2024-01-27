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
};
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref TYPE_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(received|sent)$").unwrap()
    };
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "TYPE_REGEX")]
    r#type: Option<String>,
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

#[derive(Debug, Serialize, Deserialize)]
struct Story {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    title: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct CollaborationRequest {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    role: String,
    // Joins
    user: Option<Json<User>>, // Can be null if deleted or deactivated
    story: Json<Story>,
}

#[get("/v1/me/collaboration-requests")]
#[tracing::instrument(
    name = "GET /v1/me/collaboration-requests",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
        r#type = query.r#type,
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
    let r#type = query.r#type.clone().unwrap_or("received".to_string());

    let result = sqlx::query_as::<_, CollaborationRequest>(if r#type == "received" {
        r#"
WITH received_collaboration_requests AS (
    SELECT
        sc.id AS "id",
        sc.created_at,
        sc.role,
        -- User
        JSON_BUILD_OBJECT(
            'id', "sc->story->user".id,
            'name', "sc->story->user".name,
            'username', "sc->story->user".username,
            'avatar_id', "sc->story->user".avatar_id,
            'avatar_hex', "sc->story->user".avatar_hex,
            'public_flags', "sc->story->user".public_flags
        ) AS "_user", -- Underscore is intentional
        -- Story
        JSON_BUILD_OBJECT(
            'id', "sc->story".id,
            'title', "sc->story".title
        ) AS "story"
    FROM
        story_contributors AS sc
            INNER JOIN stories AS "sc->story"
                ON sc.story_id = "sc->story".id
            INNER JOIN users AS "sc->story->user"
                ON "sc->story".user_id = "sc->story->user".id
    WHERE
        sc.user_id = $1
        AND sc.accepted_at IS NULL
        AND sc.deleted_at IS NULL
    ORDER BY
        sc.created_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    role,
    created_at,
    -- This underscore prevents selecting the actual `user` from Postgres
    _user as "user",
    story
FROM received_collaboration_requests
"#
    } else {
        r#"
WITH sent_collaboration_requests AS (
    SELECT
        sc.id AS "id",
        sc.created_at,
        sc.role,
        -- User
        CASE WHEN
            (
                "sc->user".deleted_at IS NULL
                    AND
                "sc->user".deactivated_at IS NULL
            )
        THEN
            JSON_BUILD_OBJECT(
                'id', "sc->user".id,
                'name', "sc->user".name,
                'username', "sc->user".username,
                'avatar_id', "sc->user".avatar_id,
                'avatar_hex', "sc->user".avatar_hex,
                'public_flags', "sc->user".public_flags
            )
        END AS "_user", -- Underscore is intentional
        -- Story
        JSON_BUILD_OBJECT(
            'id', "sc->story".id,
            'title', "sc->story".title
        ) AS "story"
    FROM
        story_contributors AS sc
            INNER JOIN stories AS "sc->story"
                ON sc.story_id = "sc->story".id
                AND "sc->story".deleted_at IS NULL
            INNER JOIN users AS "sc->user"
                ON sc.user_id = "sc->user".id
    WHERE
        "sc->story".user_id = $1
        AND sc.accepted_at IS NULL
    ORDER BY
        sc.created_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    role,
    created_at,
    -- This underscore prevents selecting the actual `user` from Postgres
    _user as "user",
    story
FROM sent_collaboration_requests
"#
    })
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
