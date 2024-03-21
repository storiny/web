use crate::{
    error::{
        AppError,
        FormErrorResponse,
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
use url::Url;
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Item {
    #[validate(length(min = 1, max = 32, message = "Invalid name length"))]
    name: String,
    // Target can be a URL or literal `/`.
    #[validate(length(min = 1, max = 1024, message = "Invalid target URL length"))]
    target: String,
    icon: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 5))]
    #[validate]
    items: Vec<Item>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct ResponseItem {
    id: i64,
    name: String,
    target: String,
    icon: Option<Uuid>,
}

#[patch("/v1/me/blogs/{blog_id}/settings/sidebars/lsb")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/sidebars/lsb",
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

    // Reject when the home item is missing or overflowing.
    if items
        .iter()
        .filter(|item| item.target == "/")
        .collect::<Vec<_>>()
        .len()
        != 1
    {
        return Err(ToastErrorResponse::new(None, "There must be exactly one home item").into());
    }

    // Validate targets.
    {
        let mut form_errors = Vec::new();

        items.iter().enumerate().for_each(|(index, item)| {
            if item.target != "/" && Url::parse(&item.target).is_err() {
                form_errors.push((
                    format!("items.{index}.target"),
                    "Invalid target URL".to_string(),
                ));
            }
        });

        if !form_errors.is_empty() {
            return Err(FormErrorResponse::new(
                None,
                form_errors
                    .iter()
                    .map(|item| (item.0.as_str(), item.1.as_str()))
                    .collect(),
            )
            .into());
        }
    }

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
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $1
        AND user_id = $2
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
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
            "Missing permission or the blog does not exist",
        ));
    }

    // Remove old items.
    sqlx::query(
        r#"
DELETE FROM blog_lsb_items
WHERE blog_id = $1
"#,
    )
    .bind(blog_id)
    .execute(&mut *txn)
    .await?;

    // Insert new items.

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
INSERT INTO blog_lsb_items (name, target, icon, priority, blog_id)
VALUES
"#,
    );

    items.iter().enumerate().for_each(|(index, item)| {
        query_builder.push("(");
        query_builder.push_bind(&item.name);
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
RETURNING id, name, target, icon
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
        assert_form_error_response,
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
    struct LeftSidebarItem {
        name: String,
        target: String,
        icon: Option<Uuid>,
        priority: i16,
    }

    #[sqlx::test]
    async fn can_update_lsb_items_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Assert initial items.
        let result = sqlx::query_as::<_, LeftSidebarItem>(
            r#"
SELECT name, target, icon, priority
FROM blog_lsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        let expected = vec![LeftSidebarItem {
            name: "Home".to_string(),
            target: "/".to_string(),
            icon: None,
            priority: 1,
        }];

        assert_eq!(result, expected);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![
                    Item {
                        name: "Item 1".to_string(),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Home item".to_string(),
                        target: "/".to_string(),
                        icon: Some(icon_id),
                    },
                    Item {
                        name: "Item 2".to_string(),
                        target: "https://example.com/item-2".to_string(),
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
        let result = sqlx::query_as::<_, LeftSidebarItem>(
            r#"
SELECT name, target, icon, priority
FROM blog_lsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        let expected = vec![
            LeftSidebarItem {
                name: "Item 1".to_string(),
                target: "https://example.com/item-1".to_string(),
                icon: None,
                priority: 1,
            },
            LeftSidebarItem {
                name: "Home item".to_string(),
                target: "/".to_string(),
                icon: Some(icon_id),
                priority: 2,
            },
            LeftSidebarItem {
                name: "Item 2".to_string(),
                target: "https://example.com/item-2".to_string(),
                icon: Some(icon_id),
                priority: 3,
            },
        ];

        assert_eq!(result, expected);

        Ok(())
    }

    #[sqlx::test]
    async fn can_update_lsb_items_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, (SELECT id FROM inserted_user))
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Assert initial items.
        let result = sqlx::query_as::<_, LeftSidebarItem>(
            r#"
SELECT name, target, icon, priority
FROM blog_lsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        let expected = vec![LeftSidebarItem {
            name: "Home".to_string(),
            target: "/".to_string(),
            icon: None,
            priority: 1,
        }];

        assert_eq!(result, expected);

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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![
                    Item {
                        name: "Item 1".to_string(),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Home item".to_string(),
                        target: "/".to_string(),
                        icon: Some(icon_id),
                    },
                    Item {
                        name: "Item 2".to_string(),
                        target: "https://example.com/item-2".to_string(),
                        icon: Some(icon_id),
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request as the editor has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![
                    Item {
                        name: "Item 1".to_string(),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Home item".to_string(),
                        target: "/".to_string(),
                        icon: Some(icon_id),
                    },
                    Item {
                        name: "Item 2".to_string(),
                        target: "https://example.com/item-2".to_string(),
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
        let result = sqlx::query_as::<_, LeftSidebarItem>(
            r#"
SELECT name, target, icon, priority
FROM blog_lsb_items
WHERE blog_id = $1
ORDER BY priority
"#,
        )
        .bind(blog_id)
        .fetch_all(&mut *conn)
        .await?;

        let expected = vec![
            LeftSidebarItem {
                name: "Item 1".to_string(),
                target: "https://example.com/item-1".to_string(),
                icon: None,
                priority: 1,
            },
            LeftSidebarItem {
                name: "Home item".to_string(),
                target: "/".to_string(),
                icon: Some(icon_id),
                priority: 2,
            },
            LeftSidebarItem {
                name: "Item 2".to_string(),
                target: "https://example.com/item-2".to_string(),
                icon: Some(icon_id),
                priority: 3,
            },
        ];

        assert_eq!(result, expected);

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_lsb_items_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![Item {
                    name: "Home item".to_string(),
                    target: "/".to_string(),
                    icon: None,
                }],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_lsb_items_request_for_underflowing_items(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request { items: Vec::new() })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_lsb_items_request_for_overflowing_items(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![
                    Item {
                        name: "Item 1".to_string(),
                        target: "https://storiny.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Item 2".to_string(),
                        target: "https://storiny.com/item-2".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Item 3".to_string(),
                        target: "https://storiny.com/item-3".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Item 4".to_string(),
                        target: "https://storiny.com/item-4".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Item 5".to_string(),
                        target: "https://storiny.com/item-5".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Item 6".to_string(),
                        target: "https://storiny.com/item-6".to_string(),
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
    async fn can_reject_lsb_items_request_for_an_invalid_home_item(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![
                    Item {
                        name: "Item 1".to_string(),
                        target: "https://example.com/item-1".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Item 2".to_string(),
                        target: "https://example.com/item-2".to_string(),
                        icon: None,
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "There must be exactly one home item").await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![
                    Item {
                        name: "Home item 1".to_string(),
                        target: "/".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Home item 2".to_string(),
                        target: "/".to_string(),
                        icon: None,
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "There must be exactly one home item").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_lsb_items_request_for_an_invalid_icon(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![Item {
                    name: "Home item".to_string(),
                    target: "/".to_string(),
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
    async fn can_reject_lsb_items_request_for_an_invalid_target(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/sidebars/lsb"))
            .set_json(Request {
                items: vec![
                    Item {
                        name: "Home item".to_string(),
                        target: "/".to_string(),
                        icon: None,
                    },
                    Item {
                        name: "Item 1".to_string(),
                        target: "invalid-target".to_string(),
                        icon: None,
                    },
                ],
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("items.1.target", "Invalid target URL")]).await;

        Ok(())
    }
}
