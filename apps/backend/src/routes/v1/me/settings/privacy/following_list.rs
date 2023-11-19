use crate::{
    error::AppError,
    grpc::defs::privacy_settings_def::v1::RelationVisibility,
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

lazy_static! {
    static ref FOLLOWING_LIST_REGEX: Regex = Regex::new(r"^(1|2|3)$").unwrap();
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "FOLLOWING_LIST_REGEX")]
    following_list: String,
}

#[patch("/v1/me/settings/privacy/following-list")]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match payload.following_list.parse::<i32>() {
            Ok(following_list) => match RelationVisibility::try_from(following_list) {
                Ok(visibility) => {
                    match sqlx::query(
                        r#"
                        UPDATE users
                        SET following_list_visibility = $1
                        WHERE id = $2
                        "#,
                    )
                    .bind(visibility as i16)
                    .bind(user_id)
                    .execute(&data.db_pool)
                    .await?
                    .rows_affected()
                    {
                        0 => Ok(HttpResponse::InternalServerError().finish()),
                        _ => Ok(HttpResponse::NoContent().finish()),
                    }
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            },
            Err(_) => Ok(HttpResponse::InternalServerError().finish()),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::init_app_for_test;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_set_following_list_visibility(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Set to `friends`
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/privacy/following-list")
            .set_json(Request {
                following_list: (RelationVisibility::Friends as i16).to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Following list visibility should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT following_list_visibility FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<i16, _>("following_list_visibility"),
            RelationVisibility::Friends as i16
        );

        // Set to `none`
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/following-list")
            .set_json(Request {
                following_list: (RelationVisibility::None as i16).to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Following list visibility should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT following_list_visibility FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<i16, _>("following_list_visibility"),
            RelationVisibility::None as i16
        );

        Ok(())
    }
}
