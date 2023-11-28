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
use serde_with::{
    serde_as,
    DisplayFromStr,
};
use sqlx::{
    FromRow,
    Postgres,
    QueryBuilder,
};
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = Regex::new(r"^(recent|old|popular)$").unwrap();
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

#[serde_as]
#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Follower {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
    // Boolean flags
    is_follower: bool,
    is_following: bool,
    is_friend: bool,
}

#[get("/v1/me/followers")]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let page = query.page.clone().unwrap_or(1) - 1;
    let sort = query.sort.clone().unwrap_or("popular".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    match user.id() {
        Ok(user_id) => {
            let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
                r#"
                WITH followers_result AS (
                "#,
            );

            if has_search_query {
                query_builder.push(
                    r#"
                    WITH search_query AS (
                        SELECT PLAINTO_TSQUERY('english', $4) AS tsq
                    )
                    "#,
                );
            }

            query_builder.push(
                r#"
                SELECT
                    -- Follower user
                    ru.id,
                    ru.name,
                    ru.username,
                    ru.avatar_id,
                    ru.avatar_hex,
                    ru.public_flags,
                    -- Boolean flags
                    CASE
                        WHEN COUNT("ru->is_following") = 1
                            THEN
                                TRUE
                            ELSE
                                FALSE
                    END AS "is_following",
                    CASE
                        WHEN COUNT("ru->is_friend") = 1
                            THEN
                                TRUE
                            ELSE
                                FALSE
                    END AS "is_friend"
                "#,
            );

            if has_search_query {
                query_builder.push(",");
                query_builder.push(
                    r#"
                      -- Query score
                      TS_RANK_CD(ru.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
                    "#,
                );
            }

            query_builder.push(
                r#"
                FROM
                    relations r
                        -- Join follower user
                        INNER JOIN users AS ru
                            ON r.follower_id = ru.id
                        -- Boolean follower flag
                        LEFT OUTER JOIN relations AS "ru->is_following"
                            ON "ru->is_following".followed_id = ru.id
                                AND "ru->is_following".follower_id = $1
                                AND "ru->is_following".deleted_at IS NULL
                        -- Boolean friend flag
                        LEFT OUTER JOIN friends AS "ru->is_friend"
                            ON (
                              ("ru->is_friend".transmitter_id = ru.id AND "ru->is_friend".receiver_id = $1)
                                OR
                              ("ru->is_friend".receiver_id = ru.id AND "ru->is_friend".transmitter_id = $1)
                            )
                                AND "ru->is_friend".accepted_at IS NOT NULL
                                AND "ru->is_friend".deleted_at IS NULL
                WHERE
                    r.followed_id = $1
                    AND r.deleted_at IS NULL
                "#,
            );

            if has_search_query {
                query_builder.push(r#"AND ru.search_vec @@ (SELECT tsq FROM search_query)"#);
            }

            query_builder.push(
                r#"
                GROUP BY
                    ru.id,
                    r.created_at
                ORDER BY 
                "#,
            );

            if has_search_query {
                query_builder.push("query_score DESC");
                query_builder.push(",");
            }

            query_builder.push(match sort.as_str() {
                "old" => "r.created_at",
                "popular" => "ru.follower_count DESC",
                _ => "r.created_at DESC",
            });

            query_builder.push(
                r#"
                    LIMIT $2 OFFSET $3
                )
                SELECT
                    -- Follower user
                    id,
                    name,
                    username,
                    avatar_id,
                    avatar_hex,
                    public_flags,
                    -- Boolean flags
                    TRUE AS "is_follower",
                    is_following,
                    is_friend
                FROM followers_result
                "#,
            );

            let mut db_query = query_builder
                .build_query_as::<Follower>()
                .bind(user_id)
                .bind(10_i16)
                .bind((page * 10) as i16);

            if has_search_query {
                db_query = db_query.bind(search_query);
            }

            let result = db_query.fetch_all(&data.db_pool).await?;

            Ok(HttpResponse::Ok().json(result))
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
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
    use urlencoding::encode;

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some followers
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($2, $1), ($3, $1)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/followers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_followers_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some followers
        sqlx::query(
            r#"
           INSERT INTO relations(follower_id, followed_id)
           VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
           INSERT INTO relations(follower_id, followed_id)
           VALUES ($1, $2)
            "#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/followers?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_followers_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some followers
        sqlx::query(
            r#"
           INSERT INTO relations(follower_id, followed_id)
           VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
           INSERT INTO relations(follower_id, followed_id)
           VALUES ($1, $2)
            "#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/followers?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_followers_in_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some followers
        sqlx::query(
            r#"
           INSERT INTO relations(follower_id, followed_id)
           VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
           INSERT INTO relations(follower_id, followed_id)
           VALUES ($1, $2)
            "#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/followers?sort=popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_search_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some followers
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($2, $1), ($3, $1)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/followers?query={}", encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].username, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn should_not_include_soft_deleted_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some followers
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($2, $1), ($3, $1)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the followers initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/followers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the follower relation
        let result = sqlx::query(
            r#"
            UPDATE relations
            SET deleted_at = now()
            WHERE follower_id = $1 AND followed_id = $2
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one follower
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/followers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the follower relation
        let result = sqlx::query(
            r#"
            UPDATE relations
            SET deleted_at = NULL
            WHERE follower_id = $1 AND followed_id = $2
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the followers again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/followers")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
