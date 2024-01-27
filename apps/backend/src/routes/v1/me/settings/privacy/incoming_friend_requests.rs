use crate::{
    error::AppError,
    grpc::defs::privacy_settings_def::v1::IncomingFriendRequest,
    middlewares::identity::identity::Identity,
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
    static ref FRIEND_REQUESTS_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(1|2|3|4)$").unwrap()
    };
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "FRIEND_REQUESTS_REGEX")]
    friend_requests: String,
}

#[patch("/v1/me/settings/privacy/incoming-friend-requests")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/privacy/incoming-friend-requests",
    skip_all,
    fields(
        user = user.id().ok(),
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let incoming_friend_requests = IncomingFriendRequest::try_from(
        payload
            .friend_requests
            .parse::<i32>()
            .map_err(|_| AppError::from("Invalid incoming friend requests type"))?,
    )
    .map_err(|_| AppError::from("Invalid incoming friend requests type"))?;

    match sqlx::query(
        r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
    )
    .bind(incoming_friend_requests as i16)
    .bind(user_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::InternalError(
            "user not found in database".to_string(),
        )),
        _ => Ok(HttpResponse::NoContent().finish()),
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
    async fn can_set_incoming_friend_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Set to `following`.
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/privacy/incoming-friend-requests")
            .set_json(Request {
                friend_requests: (IncomingFriendRequest::Following as i16).to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Incoming friend requests should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT incoming_friend_requests FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<i16, _>("incoming_friend_requests"),
            IncomingFriendRequest::Following as i16
        );

        // Set to `none`.
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/incoming-friend-requests")
            .set_json(Request {
                friend_requests: (IncomingFriendRequest::None as i16).to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Incoming friend requests should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT incoming_friend_requests FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<i16, _>("incoming_friend_requests"),
            IncomingFriendRequest::None as i16
        );

        Ok(())
    }
}
