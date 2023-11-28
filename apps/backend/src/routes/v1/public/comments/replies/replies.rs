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
use serde_with::{
    serde_as,
    DisplayFromStr,
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
}

#[derive(Deserialize, Validate)]
struct Fragments {
    comment_id: String,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
struct ReplyUser {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
struct StoryUser {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    username: String,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
struct Story {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    slug: String,
    #[serde_as(as = "DisplayFromStr")]
    user_id: i64,
    // Joins
    user: Json<StoryUser>,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
struct Comment {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    #[serde_as(as = "DisplayFromStr")]
    story_id: i64,
    // Joins
    story: Json<Story>,
}

#[serde_as]
#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Reply {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    hidden: bool,
    content: Option<String>,
    rendered_content: String,
    #[serde_as(as = "DisplayFromStr")]
    user_id: i64,
    #[serde_as(as = "DisplayFromStr")]
    comment_id: i64,
    // Stats
    like_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    user: Json<ReplyUser>,
    comment: Json<Comment>,
    // Boolean flags
    is_liked: bool,
}

#[get("/v1/public/comments/{comment_id}/replies")]
async fn get(
    query: QsQuery<QueryParams>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    match path.comment_id.parse::<i64>() {
        Ok(comment_id) => {
            let page = query.page.clone().unwrap_or(1) - 1;
            let mut user_id: Option<i64> = None;

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
                SELECT
                    -- Reply
                    r.id,
                    r.user_id,
                    r.comment_id,
                    r.hidden,
                    r.rendered_content,
                "#,
            );

            query_builder.push(if user_id.is_some() {
                r#"
                CASE WHEN r.user_id = $4 THEN r.content END AS "content",
                "#
            } else {
                r#"
                NULL AS "content",
                "#
            });

            query_builder.push(
                r#"
                    r.like_count,
                    r.created_at,
                    r.edited_at,
                    -- User
                    JSON_BUILD_OBJECT(
                        'id', ru.id,
                        'name', ru.name,
                        'username', ru.username,
                        'avatar_id', ru.avatar_id,
                        'avatar_hex', ru.avatar_hex,
                        'public_flags', ru.public_flags
                    ) AS "user",
                    -- Comment
                    JSON_BUILD_OBJECT(
                        'id', rc.id,
                        'story_id', rc.story_id,
                        'story', JSON_BUILD_OBJECT(
                            'id', "rc->story".id,
                            'slug', "rc->story".slug,
                            'user_id', "rc->story".user_id,
                            'user', JSON_BUILD_OBJECT(
                                'id', "rc->story->user".id,
                                'username', "rc->story->user".username
                            )
                        )
                    ) AS "comment",
                "#,
            );

            query_builder.push(if user_id.is_some() {
                r#"
                CASE
                    WHEN COUNT("r->is_liked") = 1
                        THEN
                        TRUE
                    ELSE
                        FALSE
                END AS "is_liked"
                "#
            } else {
                r#"FALSE as "is_liked""#
            });

            query_builder.push(
                r#"
                FROM
                    replies r
                        -- Join user
                        INNER JOIN users AS ru
                            ON ru.id = r.user_id
                        -- Join comment
                        INNER JOIN comments AS rc
                            ON rc.id = r.comment_id
                        -- Join comment story
                        INNER JOIN stories AS "rc->story"
                            ON "rc->story".id = rc.story_id
                        -- Join comment story user
                        INNER JOIN users AS "rc->story->user"
                            ON "rc->story->user".id = "rc->story".user_id       
                "#,
            );

            if user_id.is_some() {
                query_builder.push(
                    r#"
                    -- Boolean like flag
                    LEFT OUTER JOIN reply_likes AS "r->is_liked"
                                    ON "r->is_liked".reply_id = r.id                           
                                        AND "r->is_liked".user_id = $4
                                        AND "r->is_liked".deleted_at IS NULL
                    "#,
                );
            }

            query_builder.push(
                r#"
                WHERE
                    r.comment_id = $1
                    AND r.deleted_at IS NULL
                GROUP BY
                    r.id,
                    ru.id,
                    rc.id,
                    "rc->story".id,
                    "rc->story->user".id,
                    r.created_at
                ORDER BY
                    r.created_at DESC
                LIMIT $2 OFFSET $3
                "#,
            );

            let mut db_query = query_builder
                .build_query_as::<Reply>()
                .bind(comment_id)
                .bind(10_i16)
                .bind((page * 10) as i16);

            if user_id.is_some() {
                db_query = db_query.bind(user_id.unwrap());
            }

            let result = db_query.fetch_all(&data.db_pool).await?;

            Ok(HttpResponse::Ok().json(result))
        }
        Err(_) => Ok(HttpResponse::BadRequest().body("Invalid comment ID")),
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

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_replies(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_replies_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn should_not_include_soft_deleted_replies(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, true, false, None).await.0;

        // Should return all the replies initially
        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the replies
        let result = sqlx::query(
            r#"
            UPDATE replies
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one reply
        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the reply
        let result = sqlx::query(
            r#"
            UPDATE replies
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the replies again
        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn should_not_include_soft_deleted_replies_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        // Should return all the replies initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the replies
        let result = sqlx::query(
            r#"
            UPDATE replies
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one reply
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the reply
        let result = sqlx::query(
            r#"
            UPDATE replies
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the replies again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/public/comments/{}/replies", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
