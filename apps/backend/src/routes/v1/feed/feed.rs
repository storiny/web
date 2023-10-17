use crate::{
    error::AppError,
    middleware::identity::identity::Identity,
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
    Row,
};
use time::OffsetDateTime;

#[derive(Deserialize)]
struct QueryParams {
    page: Option<u16>,
    r#type: Option<String>, // "suggested" or "friends-and-following"
}

#[derive(sqlx::Type, Serialize, Deserialize)]
struct User {
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<String>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(sqlx::Type, Serialize, Deserialize)]
struct Tag {
    id: i64,
    name: String,
}

#[derive(FromRow, Serialize, Deserialize)]
struct Story {
    id: i64,
    title: String,
    slug: String,
    description: Option<String>,
    splash_id: Option<String>,
    splash_hex: Option<String>,
    category: String,
    age_restriction: i32,
    license: i32,
    user_id: String,
    // Stats
    word_count: i32,
    read_count: i64,
    like_count: i64,
    comment_count: i32,
    // Timestamps
    published_at: OffsetDateTime,
    edited_at: Option<OffsetDateTime>,
    // Joins
    user: Json<User>,
    tags: Vec<Tag>,
}

#[get("/v1/feed")]
async fn get(
    query: web::Query<QueryParams>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let page = &query.page;
    let r#type = &query.r#type;

    // Query for logged-in users
    if user.is_some() {
        match user.unwrap().id() {
            Ok(user_id_str) => match user_id_str.parse::<i64>() {
                Ok(user_id) => {
                    let _ = sqlx::query_file_as!(
                        Story,
                        "queries/home_feed/friends_and_following.sql",
                        user_id,
                        10
                    )
                    .fetch_all(&data.db_pool)
                    .await?;
                }
                Err(_) => HttpResponse::InternalServerError().finish(),
            },
            Err(_) => HttpResponse::InternalServerError().finish(),
        }
    }

    sqlx::query(
        r#"
        SELECT * FROM stories s
            INNER JOIN users u
                ON s.user_id = u.id
        WHERE s.deleted_at IS NULL AND s.published_at IS NOT NULL
        "#,
    )
    .fetch_one(&data.db_pool)
    .await?;
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    // use super::*;
    // use crate::utils::init_app_for_test::init_app_for_test;
    // use actix_http::body::to_bytes;
    // use actix_web::test;
    // use sqlx::PgPool;
    //
    // #[sqlx::test(fixtures("user"))]
    // async fn can_handle_account_recovery_request(pool: PgPool) -> sqlx::Result<()> {
    //     let mut conn = pool.acquire().await?;
    //     let app = init_app_for_test(post, pool, false).await.0;
    //
    //     let req = test::TestRequest::post()
    //         .uri("/v1/auth/recovery")
    //         .set_json(Request {
    //             email: "someone@example.com".to_string(),
    //         })
    //         .to_request();
    //     let res = test::call_service(&app, req).await;
    //
    //     assert!(res.status().is_success());
    //
    //     // Should insert a password reset token into the database
    //     let result = sqlx::query(
    //         r#"
    //         SELECT EXISTS(
    //             SELECT 1 FROM tokens
    //             WHERE type = $1
    //         )
    //         "#,
    //     )
    //         .bind(TokenType::PasswordReset.to_string())
    //         .fetch_one(&mut *conn)
    //         .await?;
    //
    //     assert!(result.get::<bool, _>("exists"));
    //
    //     Ok(())
    // }
}
