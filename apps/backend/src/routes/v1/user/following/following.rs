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
    FromRow,
    Postgres,
    QueryBuilder,
};
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = Regex::new(r"^(recent|old|popular)$").unwrap();
}

#[derive(Deserialize, Validate)]
struct Fragments {
    user_id: String,
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

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Following {
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

#[get("/v1/user/{user_id}/following")]
async fn get(
    query: QsQuery<QueryParams>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    match path.user_id.parse::<i64>() {
        Ok(user_id) => {
            let page = query.page.clone().unwrap_or(1) - 1;
            let sort = query.sort.clone().unwrap_or("popular".to_string());
            let search_query = query.query.clone().unwrap_or_default();
            let has_search_query = !search_query.trim().is_empty();
            let mut current_user_id: Option<i64> = None;

            if let Some(user) = maybe_user {
                match user.id() {
                    Ok(id) => {
                        current_user_id = Some(id);
                    }
                    Err(_) => return Ok(HttpResponse::InternalServerError().finish()),
                }
            }

            let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
                r#"
                WITH user_following AS (
                "#,
            );

            if has_search_query {
                query_builder.push(
                    r#"
                    WITH search_query AS (
                        SELECT PLAINTO_TSQUERY('english', "#,
                );

                query_builder.push(if current_user_id.is_some() {
                    "$5"
                } else {
                    "$4"
                });

                query_builder.push(
                    r#") AS tsq
                    )
                    "#,
                );
            }

            query_builder.push(
                r#"
                SELECT
                    -- Followed user
                    ru.id,
                    ru.name,
                    ru.username,
                    ru.avatar_id,
                    ru.avatar_hex,
                    ru.public_flags,
                "#,
            );

            query_builder.push(if current_user_id.is_some() {
                r#"
                -- Boolean flags
                CASE
                    WHEN COUNT("ru->is_follower") = 1
                        THEN
                            TRUE
                        ELSE
                            FALSE
                END AS "is_follower",
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
                "#
            } else {
                r#"
                -- Boolean flags
                FALSE AS "is_follower",
                FALSE AS "is_following",
                FALSE AS "is_friend"
                "#
            });

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
                        -- Join source user
                        INNER JOIN users AS source_user
                            ON source_user.id = $1
                        -- Join followed user
                        INNER JOIN users AS ru
                            ON r.followed_id = ru.id
                "#,
            );

            if current_user_id.is_some() {
                query_builder.push(
                    r#"
                    -- Boolean following flag
                    LEFT OUTER JOIN relations AS "ru->is_following"
                        ON "ru->is_following".followed_id = ru.id
                            AND "ru->is_following".follower_id = $4
                            AND "ru->is_following".deleted_at IS NULL
                    -- Boolean follower flag
                    LEFT OUTER JOIN relations AS "ru->is_follower"
                        ON "ru->is_follower".follower_id = ru.id
                            AND "ru->is_follower".followed_id = $4
                            AND "ru->is_follower".deleted_at IS NULL 
                    -- Boolean friend flag
                    LEFT OUTER JOIN friends AS "ru->is_friend"
                        ON (
                          ("ru->is_friend".transmitter_id = ru.id AND "ru->is_friend".receiver_id = $4)
                            OR
                          ("ru->is_friend".receiver_id = ru.id AND "ru->is_friend".transmitter_id = $4)
                        )
                            AND "ru->is_friend".accepted_at IS NOT NULL
                            AND "ru->is_friend".deleted_at IS NULL
                    "#,
                );
            }

            query_builder.push(
                r#"
                WHERE
                    r.follower_id = $1
                    AND r.deleted_at IS NULL
                "#,
            );

            query_builder.push(if current_user_id.is_some() {
                r#"
                -- Make sure to handle private user
                AND (
                    NOT source_user.is_private OR
                    EXISTS (
                        SELECT
                            1
                        FROM
                            friends
                        WHERE
                            (transmitter_id = source_user.id AND receiver_id = $4)
                                OR (transmitter_id = $4 AND receiver_id = source_user.id)
                                AND accepted_at IS NOT NULL
                    )
                )
                -- Handle `following_list_visibility`
                AND (
                    -- Everyone
                    source_user.following_list_visibility = 1
                    -- Friends
                    OR (
                        source_user.following_list_visibility = 2
                            AND EXISTS (
                                SELECT
                                    1
                                FROM
                                    friends
                                WHERE
                                    (transmitter_id = source_user.id AND receiver_id = $4)
                                        OR (transmitter_id = $4 AND receiver_id = source_user.id)
                                        AND accepted_at IS NOT NULL
                            )
                        )
                )
                "#
            } else {
                r#"
                AND source_user.is_private IS FALSE
                AND (
                    -- Everyone
                    source_user.following_list_visibility = 1
                )
                "#
            });

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
                    -- Followed user
                    id,
                    name,
                    username,
                    avatar_id,
                    avatar_hex,
                    public_flags,
                    -- Boolean flags
                    is_follower,
                    is_following,
                    is_friend
                FROM user_following
                "#,
            );

            let mut db_query = query_builder
                .build_query_as::<Following>()
                .bind(user_id)
                .bind(10_i16)
                .bind((page * 10) as i16);

            if current_user_id.is_some() {
                db_query = db_query.bind(current_user_id.unwrap());
            }

            if has_search_query {
                db_query = db_query.bind(search_query);
            }

            let result = db_query.fetch_all(&data.db_pool).await?;

            Ok(HttpResponse::Ok().json(result))
        }
        Err(_) => Ok(HttpResponse::BadRequest().body("Invalid user ID")),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        grpc::defs::privacy_settings_def::v1::RelationVisibility,
        test_utils::{
            init_app_for_test,
            res_to_string,
        },
    };
    use actix_web::test;
    use sqlx::PgPool;
    use urlencoding::encode;

    // Logged-out

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users_in_old_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followed users
        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users_in_recent_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followed users
        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users_in_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followed users
        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_search_followed_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].username, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn should_not_return_followed_users_for_private_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return followed users initially
        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 2);

        // Make the user private
        let result = sqlx::query(
            r#"
            UPDATE users
            SET is_private = TRUE
            WHERE id = $1
            "#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return followed users
        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn should_not_include_soft_deleted_followed_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the followed users initially
        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the followed user relation
        let result = sqlx::query(
            r#"
            UPDATE relations
            SET deleted_at = now()
            WHERE follower_id = $1 AND followed_id = $2
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one followed user
        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the followed user relation
        let result = sqlx::query(
            r#"
            UPDATE relations
            SET deleted_at = NULL
            WHERE follower_id = $1 AND followed_id = $2
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the followed users again
        let req = test::TestRequest::get()
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users_in_old_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users_in_recent_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_return_followed_users_in_popular_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_search_followed_users_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].username, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_handle_followed_users_for_private_user_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should return followed users initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 1);

        // Make the user private
        let result = sqlx::query(
            r#"
            UPDATE users
            SET is_private = TRUE
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return followed users
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 0);

        // Add the user as friend
        let result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id, accepted_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return followed users again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn can_handle_following_list_visibility_set_to_friends_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should return followed users initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 1);

        // Change the `following_list_visibility` to friends
        let result = sqlx::query(
            r#"
            UPDATE users
            SET following_list_visibility = $2
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .bind(RelationVisibility::Friends as i16)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return followed users
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 0);

        // Add the user as friend
        let result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id, accepted_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return followed users again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn should_not_return_followed_users_when_the_following_list_visibility_is_set_to_none_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should return followed users initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 1);

        // Change the `following_list_visibility` to none
        let result = sqlx::query(
            r#"
            UPDATE users
            SET following_list_visibility = $2
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .bind(RelationVisibility::None as i16)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return followed users
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("following"))]
    async fn should_not_include_soft_deleted_followed_users_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followed users
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the followed users initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the followed user relation
        let result = sqlx::query(
            r#"
            UPDATE relations
            SET deleted_at = now()
            WHERE follower_id = $1 AND followed_id = $2
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one followed user
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the followed user relation
        let result = sqlx::query(
            r#"
            UPDATE relations
            SET deleted_at = NULL
            WHERE follower_id = $1 AND followed_id = $2
            "#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the followed users again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/user/{}/following", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Following>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
