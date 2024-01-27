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
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    types::Json,
    FromRow,
};
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, FromRow, Serialize, Deserialize, PartialEq)]
struct Contributor {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    has_accepted: bool,
    role: String,
    // Joins
    user: Option<Json<User>>, // Can be null if deleted or deactivated
}

#[get("/v1/me/stories/{story_id}/contributors")]
#[tracing::instrument(
    name = "GET /v1/me/stories/{story_id}/contributors",
    skip_all,
    fields(
        user_id = user.id().ok(),
        story_id = %path.story_id
    ),
    err
)]
async fn get(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let result = sqlx::query_as::<_, Contributor>(
        r#"
WITH target_story AS (
    SELECT id FROM stories
    WHERE
        id = $2
        AND user_id = $1
        AND deleted_at IS NULL
),
contributors AS (
    SELECT
        -- Contributor
        sc.id,
        sc.user_id,
        CASE WHEN
            sc.accepted_at IS NOT NULL THEN
                TRUE
            ELSE
                FALSE
        END AS "has_accepted",
        sc.role,
        -- User
        CASE WHEN
            (
                c.deleted_at IS NULL
                    AND
                c.deactivated_at IS NULL
            )
        THEN
            JSON_BUILD_OBJECT(
                'id', c.id,
                'name', c.name,
                'username', c.username,
                'avatar_id', c.avatar_id,
                'avatar_hex', c.avatar_hex,
                'public_flags', c.public_flags
            ) 
        END AS "_user" -- Underscore is intentional
    FROM
        story_contributors AS sc
            INNER JOIN users AS c
                ON sc.user_id = c.id
    WHERE
        sc.story_id = (SELECT id FROM target_story)
    ORDER BY
        sc.role,
        sc.accepted_at DESC NULLS LAST
)
SELECT
    id,
    role,
    has_accepted,
    user_id,
    -- This underscore prevents selecting the actual `user` from Postgres
    _user as "user"
FROM contributors
WHERE EXISTS (
    SELECT 1 FROM target_story
)
"#,
    )
    .bind(user_id)
    .bind(story_id)
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

    #[sqlx::test(fixtures("contributor_list"))]
    async fn can_return_contributors(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/contributors", 5))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Contributor>>(&res_to_string(res).await);
        let list = vec![
            Contributor {
                id: 7_i64,
                role: "editor".to_string(),
                has_accepted: true,
                user: None,
                user_id: 3_i64,
            },
            Contributor {
                id: 8_i64,
                role: "editor".to_string(),
                has_accepted: true,
                user: None,
                user_id: 4_i64,
            },
            Contributor {
                id: 6_i64,
                role: "viewer".to_string(),
                has_accepted: false,
                user: Some(sqlx::types::Json::from(User {
                    id: 2_i64,
                    name: "Sample user 2".to_string(),
                    username: "sample_user_2".to_string(),
                    public_flags: 0,
                    avatar_id: None,
                    avatar_hex: None,
                })),
                user_id: 2_i64,
            },
        ];

        assert!(json.is_ok());
        assert_eq!(json.unwrap(), list);

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/contributors", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Contributor>>(&res_to_string(res).await).unwrap();

        assert!(json.is_empty());

        Ok(())
    }
}
