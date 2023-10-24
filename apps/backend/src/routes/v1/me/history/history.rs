use crate::{
    error::AppError,
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{
    get,
    http::header::ContentType,
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
    postgres::{
        PgHasArrayType,
        PgTypeInfo,
    },
    types::Json,
    Execute,
    FromRow,
    Postgres,
    QueryBuilder,
    TypeInfo,
};
use time::OffsetDateTime;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = Regex::new(r"^(recent|old)$").unwrap();
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

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<String>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct Tag {
    id: i64,
    name: String,
}

impl PgHasArrayType for Tag {
    fn array_type_info() -> PgTypeInfo {
        PgTypeInfo::with_name("tags")
    }

    fn array_compatible(ty: &PgTypeInfo) -> bool {
        ty.name() == "tags"
    }
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Bookmark {
    id: i64,
    title: String,
    // slug: String,
    description: Option<String>,
    splash_id: Option<String>,
    splash_hex: Option<String>,
    // category: String,
    age_restriction: i16,
    license: i16,
    user_id: i64,
    // Stats
    word_count: i32,
    read_count: i64,
    like_count: i64,
    comment_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    published_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    user: Json<User>,
    tags: Vec<Tag>,
    // Boolean flags
    is_liked: bool,
    is_bookmarked: bool,
}

#[get("/v1/me/bookmarks")]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            let page = query.page.clone().unwrap_or_default();
            let sort = query.sort.clone().unwrap_or("recent".to_string());
            let search_query = query.query.clone().unwrap_or_default();
            let has_search_query = !search_query.trim().is_empty();

            let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
                r#"
                WITH bookmarks AS (
                "#,
            );

            // Query CTE
            if has_search_query {
                query_builder.push(
                    r#"
                    WITH search_query AS (
                        SELECT plainto_tsquery('english',
                    "#,
                );
                query_builder.push_bind(search_query);
                query_builder.push(
                    r#"
                        ) as tsq
                    )
                    "#,
                );
            }

            query_builder.push(
                r#"
                    SELECT
                        -- Story
                        s.id,
                        s.title,
                        s.slug AS "slug!",
                        s.description,
                        s.splash_id,
                        s.splash_hex,
                        s.category::TEXT AS "category!",
                        s.age_restriction,
                        s.license,
                        s.user_id,
                        -- Stats
                        s.word_count,
                        s.read_count,
                        s.like_count,
                        s.comment_count,
                        -- Timestamps
                        s.published_at AS "published_at!",
                        s.edited_at,
                        -- Boolean flags
                        CASE WHEN count("s->is_liked") = 1 THEN
                            TRUE
                        ELSE
                            FALSE
                        END AS "is_liked!",
                        -- User
                        json_build_object(
                            'id', su.id,
                            'name', su.name,
                            'username', su.username,
                            'avatar_id', su.avatar_id,
                            'avatar_hex', su.avatar_hex,
                            'public_flags', su.public_flags
                        ) AS "user!: Json<User>",
                        -- Tags
                        coalesce(
                            array_agg(
                                (
                                    "s->story_tags->tag".id,
                                    "s->story_tags->tag".name
                                )
                            ) FILTER (
                                WHERE "s->story_tags->tag".id IS NOT NULL
                            ),
                            '{}'
                        ) AS "tags!: Vec<Tag>"
                "#,
            );

            // Search ranking
            if has_search_query {
                query_builder.push(",");
                query_builder.push(
                    r#"
                    -- Query score
                    ts_rank_cd(s.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
                    "#,
                );
            }

            query_builder.push(
                r#"
                FROM
                bookmarks b
                    INNER JOIN stories s
                        INNER JOIN users su ON su.id = s.user_id
                    ON s.id = b.story_id
                "#,
            );

            query_builder.push(
                r#"
                    -- Join story tags
                    LEFT OUTER JOIN story_tags AS "s->story_tags"
                    -- Join tags
                    INNER JOIN tags AS "s->story_tags->tag" ON "s->story_tags->tag".id =
            "s->story_tags".tag_id         --
                    ON "s->story_tags".story_id = s.id
                    --
                    -- Boolean story like flag
                    LEFT OUTER JOIN story_likes AS "s->is_liked" ON "s->is_liked".story_id = s.id
                        AND "s->is_liked".user_id =
                "#,
            );

            query_builder.push_bind(user_id);

            query_builder.push(
                r#"
                        AND "s->is_liked".deleted_at IS NULL
                WHERE
                    b.user_id =
                "#,
            );

            query_builder.push_bind(user_id);

            // Match search query
            if has_search_query {
                query_builder.push(
                    r#"
                    AND s.search_vec @@ (SELECT tsq FROM search_query)
                    "#,
                );
            }

            query_builder.push(
                r#"
                    AND b.deleted_at IS NULL
                GROUP BY
                    s.id,
                    su.id,
                    b.created_at
                ORDER BY
                "#,
            );

            // Sort by search query ranking
            if has_search_query {
                query_builder.push(" query_score DESC ");
                query_builder.push(",");
            }

            // Sort
            query_builder.push(" b.created_at ");
            query_builder.push(if sort == "recent" { "DESC" } else { "ASC" });

            // Limit
            query_builder.push(" LIMIT ");
            query_builder.push_bind(10i16);

            // Offset
            query_builder.push(" OFFSET ");
            query_builder.push_bind((page * 10) as i16);

            query_builder.push(
                r#"
                )
                SELECT
                    -- Story
                    id,
                    title,
                    "slug!",
                    description,
                    splash_id,
                    splash_hex,
                    "category!",
                    age_restriction,
                    license,
                    user_id,
                    -- Stats
                    word_count,
                    read_count,
                    like_count,
                    comment_count,
                    -- Timestamps
                    "published_at!",
                    edited_at,
                    -- Boolean flags
                    TRUE AS "is_bookmarked!",
                    "is_liked!",
                    -- Joins
                    "user!: Json<User>",
                    "tags!: Vec<Tag>"
                FROM
                    bookmarks
                "#,
            );

            let result = query_builder
                .build_query_as::<Bookmark>()
                .fetch_all(&data.db_pool)
                .await
                .unwrap();

            Ok(HttpResponse::Ok()
                .content_type(ContentType::json())
                .json(result))
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

// TODO: Clean after https://github.com/launchbadge/sqlx/issues/1031
impl ::sqlx::decode::Decode<'static, ::sqlx::Postgres> for User
where
    i64: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    i64: ::sqlx::types::Type<::sqlx::Postgres>,
    String: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    String: ::sqlx::types::Type<::sqlx::Postgres>,
    Option<String>: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    Option<String>: ::sqlx::types::Type<::sqlx::Postgres>,
    i32: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    i32: ::sqlx::types::Type<::sqlx::Postgres>,
{
    fn decode(
        value: ::sqlx::postgres::PgValueRef<'static>,
    ) -> Result<Self, Box<dyn ::std::error::Error + 'static + Send + Sync>> {
        let mut decoder = ::sqlx::postgres::types::PgRecordDecoder::new(value)?;
        let id = decoder.try_decode::<i64>()?;
        let name = decoder.try_decode::<String>()?;
        let username = decoder.try_decode::<String>()?;
        let avatar_id = decoder.try_decode::<Option<String>>()?;
        let avatar_hex = decoder.try_decode::<Option<String>>()?;
        let public_flags = decoder.try_decode::<i32>()?;

        Ok(User {
            id,
            name,
            username,
            avatar_id,
            avatar_hex,
            public_flags,
        })
    }
}

impl ::sqlx::Type<::sqlx::Postgres> for User {
    fn type_info() -> ::sqlx::postgres::PgTypeInfo {
        ::sqlx::postgres::PgTypeInfo::with_name("User")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_utils::init_app_for_test;
    use actix_http::body::to_bytes;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use std::str;

    #[sqlx::test(fixtures("bookmark"))]
    async fn can_return_bookmarks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id) 
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id)
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert!(json.unwrap().len() > 0);

        Ok(())
    }
}
