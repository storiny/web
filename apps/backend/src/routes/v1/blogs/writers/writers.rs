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
    FromRow,
    Postgres,
    QueryBuilder,
};
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Writer {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
    follower_count: i32,
    story_count: i32,
    rendered_bio: String,
    // Boolean flags
    is_following: bool,
    is_muted: bool,
}

#[get("/v1/blogs/{blog_id}/writers")]
#[tracing::instrument(
    name = "GET /v1/blogs/{blog_id}/writers",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        blog_id = %path.blog_id,
        page = query.page
    ),
    err
)]
async fn get(
    path: web::Path<Fragments>,
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = maybe_user.map(|user| user.id()).transpose()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    tracing::Span::current().record("user_id", user_id);

    let page = query.page.unwrap_or(1) - 1;

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH blog_writers AS (
    SELECT
        -- User
        u.id,
        u.name,
        u.username,
        u.avatar_id,
        u.avatar_hex,
        u.public_flags,
        u.follower_count,
        u.story_count,
        u.rendered_bio,
"#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
-- Boolean flags
"u->is_following".follower_id IS NOT NULL AS "is_following",
"u->is_muted".muter_id IS NOT NULL AS "is_muted"
"#
    } else {
        r#"
FALSE AS "is_following",
FALSE AS "is_muted"
"#
    });

    query_builder.push(
        r#"
FROM
    blog_writers AS bw
        INNER JOIN users AS u
            ON bw.receiver_id = u.id
            AND u.deleted_at IS NULL
            AND u.deactivated_at IS NULL
"#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
-- Boolean following flag
LEFT OUTER JOIN relations AS "u->is_following"
    ON "u->is_following".followed_id = u.id
    AND "u->is_following".follower_id = $4
    AND "u->is_following".deleted_at IS NULL
--
-- Boolean muted flag
LEFT OUTER JOIN mutes AS "u->is_muted"
    ON "u->is_muted".muted_id = u.id
    AND "u->is_muted".muter_id = $4
    AND "u->is_muted".deleted_at IS NULL
"#,
        );
    }

    query_builder.push(
        r#"
WHERE
    bw.blog_id = $1
    AND bw.accepted_at IS NOT NULL
    AND bw.deleted_at IS NULL
GROUP BY
    u.id,
    u.follower_count
"#,
    );

    if user_id.is_some() {
        query_builder.push(",");
        query_builder.push(
            r#"
"u->is_following".follower_id,
"u->is_muted".muter_id
"#,
        );
    }

    query_builder.push(
        r#"
    ORDER BY
        u.follower_count DESC
    LIMIT $2 OFFSET $3
)
SELECT
    -- User
    id,
    name,
    username,
    avatar_id,
    avatar_hex,
    public_flags,
    follower_count,
    story_count,
    rendered_bio,
    -- Boolean flags
    is_following,
    is_muted
FROM blog_writers
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Writer>()
        .bind(blog_id)
        .bind(10_i16)
        .bind((page * 10) as i16);

    if let Some(user_id) = user_id {
        db_query = db_query.bind(user_id);
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
    use sqlx::PgPool;

    // Logged-out.

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_blog_writers(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);
        assert!(json.iter().all(|item| !item.is_following && !item.is_muted));

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deleted_writers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        // Soft-delete one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not include the soft-deleted writer.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(!json.iter().any(|item| item.id == 4_i64));

        // Recover the writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deactivated_writers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        // Deactivate one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not include the deactivated writer.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(!json.iter().any(|item| item.id == 4_i64));

        // Activate the writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }

    // Logged-in.

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_blog_writers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);
        assert!(json.iter().all(|item| !item.is_following && !item.is_muted));

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_is_following_flag_for_blog_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| !writer.is_following));

        // Follow the writers.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| writer.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_is_muted_flag_for_blog_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| !writer.is_muted));

        // Mute the writers.
        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| writer.is_muted));

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deleted_writers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        // Soft-delete one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not include the soft-deleted writer.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(!json.iter().any(|item| item.id == 4_i64));

        // Recover the writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deactivated_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        // Deactivate one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not include the deactivated writer.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(!json.iter().any(|item| item.id == 4_i64));

        // Activate the writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/blogs/{}/writers", 5_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }
}
