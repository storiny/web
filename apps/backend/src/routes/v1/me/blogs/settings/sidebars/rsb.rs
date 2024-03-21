use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    FromRow,
    Postgres,
    QueryBuilder,
    Row,
};
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Item {
    #[validate(length(min = 1, max = 32, message = "Invalid primary text length"))]
    primary_text: String,
    #[validate(length(min = 0, max = 32, message = "Invalid secondary text length"))]
    secondary_text: Option<String>,
    #[validate(url(message = "Invalid target URL"))]
    #[validate(length(min = 1, max = 1024, message = "Invalid target URL length"))]
    target: String,
    icon: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 0, max = 5))]
    #[validate]
    items: Vec<Item>,
    #[validate(length(min = 0, max = 32, message = "Invalid label length"))]
    label: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct ResponseItem {
    id: i64,
    primary_text: String,
    secondary_text: Option<String>,
    target: String,
    icon: Option<Uuid>,
}

#[patch("/v1/me/blogs/{blog_id}/settings/sidebars/rsb")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/sidebars/rsb",
    skip_all,
    fields(
        user = user.id().ok(),
        blog_id = %path.blog_id,
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let items = &payload.items;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    // Check permission.
    let result = sqlx::query(
        r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $1
        AND user_id = $2
        AND deleted_at IS NULL
        AND has_plus_features IS TRUE
), blog_as_editor AS (
    SELECT 1 FROM blog_editors AS be
        INNER JOIN blogs AS b
            ON be.blog_id = b.id
            AND b.has_plus_features IS TRUE
    WHERE
        be.blog_id = $1
        AND be.user_id = $2
        AND be.accepted_at IS NOT NULL
        AND be.deleted_at IS NULL
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
            "Missing permission, the blog does not exist, or it does not have plus features",
        ));
    }

    // Remove old items.
    sqlx::query(
        r#"
DELETE FROM blog_rsb_items
WHERE blog_id = $1
"#,
    )
    .bind(blog_id)
    .execute(&mut *txn)
    .await?;

    // Update the label.
    sqlx::query(
        r#"
UPDATE blogs
SET rsb_items_label = $1
WHERE id = $2
"#,
    )
    .bind(&payload.label)
    .bind(blog_id)
    .execute(&mut *txn)
    .await?;

    if items.is_empty() {
        txn.commit().await?;

        let response: Vec<ResponseItem> = Vec::new();

        return Ok(HttpResponse::Ok().json(response));
    }

    // Insert new items.

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
INSERT INTO blog_rsb_items
    (primary_text, secondary_text, target, icon, priority, blog_id)
VALUES
"#,
    );

    items.iter().enumerate().for_each(|(index, item)| {
        query_builder.push("(");
        query_builder.push_bind(&item.primary_text);
        query_builder.push(",");
        query_builder.push_bind(&item.secondary_text);
        query_builder.push(",");
        query_builder.push_bind(&item.target);
        query_builder.push(",");
        query_builder.push_bind(item.icon);
        query_builder.push(",");
        query_builder.push_bind((index + 1) as i16);
        query_builder.push(",");
        query_builder.push_bind(blog_id);
        query_builder.push(")");

        if items.get(index + 1).is_some() {
            query_builder.push(" , ");
        }
    });

    query_builder.push(
        r#"
RETURNING id, primary_text, secondary_text, target, icon
    "#,
    );

    match query_builder
        .build_query_as::<ResponseItem>()
        .fetch_all(&mut *txn)
        .await
    {
        Ok(items) => match items.len() {
            row_count if row_count != items.len() => Err(AppError::InternalError(
                "inserted item count does not match the length of provided items".to_string(),
            )),
            _ => {
                txn.commit().await?;

                Ok(HttpResponse::Ok().json(items))
            }
        },
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // Icon is not present in the assets table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "One of the items has an invalid icon",
                    )));
                }
            }

            Err(AppError::SqlxError(error))
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        assert_toast_error_response,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[derive(Debug, FromRow, Deserialize, PartialEq)]
    struct RightSidebarItem {
        primary_text: String,
        secondary_text: Option<String>,
        target: String,
        icon: Option<Uuid>,
        priority: i16,
    }

    #[sqlx::test]
    async fn can_update_rsb_items_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let icon_id = Uuid::new_v4();

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(icon_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id, rsb_items_label
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        assert_eq!(result.get::<String, _>("rsb_items_label"), "");

        // Assert initial items.
        let result = sqlx::query_as::<_, RightSidebarItem>(
            r#"
SELECT primary_text, secondary_text, target, icon, priority
FROM blog_rsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        assert!(result.is_empty());

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "Some label".to_string(),
                items: vec![
                    Item {
                        primary_text: "Item 1".to_string(),
                        secondary_text: Some("item-1".to_string()),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 2".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-2".to_string(),
                        icon: Some(icon_id),
                    },
                    Item {
                        primary_text: "Item 3".to_string(),
                        secondary_text: Some("item-3".to_string()),
                        target: "https://example.com/item-3".to_string(),
                        icon: Some(icon_id),
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<ResponseItem>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);

        // Sidebar items should get updated in the database.
        let result = sqlx::query_as::<_, RightSidebarItem>(
            r#"
SELECT primary_text, secondary_text, target, icon, priority
FROM blog_rsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        let expected = vec![
            RightSidebarItem {
                primary_text: "Item 1".to_string(),
                secondary_text: Some("item-1".to_string()),
                target: "https://example.com/item-1".to_string(),
                icon: None,
                priority: 1,
            },
            RightSidebarItem {
                primary_text: "Item 2".to_string(),
                secondary_text: None,
                target: "https://example.com/item-2".to_string(),
                icon: Some(icon_id),
                priority: 2,
            },
            RightSidebarItem {
                primary_text: "Item 3".to_string(),
                secondary_text: Some("item-3".to_string()),
                target: "https://example.com/item-3".to_string(),
                icon: Some(icon_id),
                priority: 3,
            },
        ];

        assert_eq!(result, expected);

        // Label should get updated.
        let result = sqlx::query(
            r#"
SELECT rsb_items_label FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("rsb_items_label"),
            "Some label".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_update_rsb_items_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let icon_id = Uuid::new_v4();

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(icon_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert a blog.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user 1', 'sample_user_1', 'sample_1@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, (SELECT id FROM inserted_user), TRUE)
RETURNING id, rsb_items_label
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        assert_eq!(result.get::<String, _>("rsb_items_label"), "");

        // Assert initial items.
        let result = sqlx::query_as::<_, RightSidebarItem>(
            r#"
SELECT primary_text, secondary_text, target, icon, priority
FROM blog_rsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        assert!(result.is_empty());

        // Add the current user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "Some label".to_string(),
                items: vec![
                    Item {
                        primary_text: "Item 1".to_string(),
                        secondary_text: Some("item-1".to_string()),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 2".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-2".to_string(),
                        icon: Some(icon_id),
                    },
                    Item {
                        primary_text: "Item 3".to_string(),
                        secondary_text: Some("item-3".to_string()),
                        target: "https://example.com/item-3".to_string(),
                        icon: Some(icon_id),
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request as the editor has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        // Accept the editor.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "Some label".to_string(),
                items: vec![
                    Item {
                        primary_text: "Item 1".to_string(),
                        secondary_text: Some("item-1".to_string()),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 2".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-2".to_string(),
                        icon: Some(icon_id),
                    },
                    Item {
                        primary_text: "Item 3".to_string(),
                        secondary_text: Some("item-3".to_string()),
                        target: "https://example.com/item-3".to_string(),
                        icon: Some(icon_id),
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<ResponseItem>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);

        // Sidebar items should get updated in the database.
        let result = sqlx::query_as::<_, RightSidebarItem>(
            r#"
SELECT primary_text, secondary_text, target, icon, priority
FROM blog_rsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        let expected = vec![
            RightSidebarItem {
                primary_text: "Item 1".to_string(),
                secondary_text: Some("item-1".to_string()),
                target: "https://example.com/item-1".to_string(),
                icon: None,
                priority: 1,
            },
            RightSidebarItem {
                primary_text: "Item 2".to_string(),
                secondary_text: None,
                target: "https://example.com/item-2".to_string(),
                icon: Some(icon_id),
                priority: 2,
            },
            RightSidebarItem {
                primary_text: "Item 3".to_string(),
                secondary_text: Some("item-3".to_string()),
                target: "https://example.com/item-3".to_string(),
                icon: Some(icon_id),
                priority: 3,
            },
        ];

        assert_eq!(result, expected);

        // Label should get updated.
        let result = sqlx::query(
            r#"
SELECT rsb_items_label FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("rsb_items_label"),
            "Some label".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reset_rsb_items(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id, rsb_items_label
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "Some label".to_string(),
                items: vec![
                    Item {
                        primary_text: "Item 1".to_string(),
                        secondary_text: Some("item-1".to_string()),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 2".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-2".to_string(),
                        icon: None,
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Sidebar items should get updated in the database.
        let result = sqlx::query_as::<_, RightSidebarItem>(
            r#"
SELECT primary_text, secondary_text, target, icon, priority
FROM blog_rsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        let expected = vec![
            RightSidebarItem {
                primary_text: "Item 1".to_string(),
                secondary_text: Some("item-1".to_string()),
                target: "https://example.com/item-1".to_string(),
                icon: None,
                priority: 1,
            },
            RightSidebarItem {
                primary_text: "Item 2".to_string(),
                secondary_text: None,
                target: "https://example.com/item-2".to_string(),
                icon: None,
                priority: 2,
            },
        ];

        assert_eq!(result, expected);

        // Label should get updated.
        let result = sqlx::query(
            r#"
SELECT rsb_items_label FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("rsb_items_label"),
            "Some label".to_string()
        );

        // Reset the items.
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "".to_string(),
                items: Vec::new(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<ResponseItem>>(&res_to_string(res).await).unwrap();

        assert!(json.is_empty());

        // Sidebar items should get updated in the database.
        let result = sqlx::query_as::<_, RightSidebarItem>(
            r#"
SELECT primary_text, secondary_text, target, icon, priority
FROM blog_rsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        assert!(result.is_empty());

        // Label should get updated.
        let result = sqlx::query(
            r#"
SELECT rsb_items_label FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("rsb_items_label"), "".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_rsb_items_request_for_a_regular_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, FALSE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "".to_string(),
                items: Vec::new(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_rsb_items_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "".to_string(),
                items: Vec::new(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_rsb_items_request_for_overflowing_items(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "Some label".to_string(),
                items: vec![
                    Item {
                        primary_text: "Item 1".to_string(),
                        secondary_text: Some("item-1".to_string()),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 2".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-2".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 3".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-3".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 4".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-4".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 5".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-5".to_string(),
                        icon: None,
                    },
                    Item {
                        primary_text: "Item 6".to_string(),
                        secondary_text: None,
                        target: "https://example.com/item-6".to_string(),
                        icon: None,
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_rsb_items_request_for_an_invalid_icon(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "".to_string(),
                items: vec![Item {
                    primary_text: "Item 1".to_string(),
                    secondary_text: None,
                    target: "https://example.com/item-1".to_string(),
                    icon: Some(Uuid::new_v4()),
                }],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "One of the items has an invalid icon").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_rsb_items_request_for_an_invalid_target(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/rsb"))
            .set_json(Request {
                label: "".to_string(),
                items: vec![Item {
                    primary_text: "Item 1".to_string(),
                    secondary_text: None,
                    target: "invalid-target".to_string(),
                    icon: Some(Uuid::new_v4()),
                }],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        Ok(())
    }
}
