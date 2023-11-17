use crate::grpc::defs::connection_def::v1::{Connection, Provider};
use crate::grpc::defs::profile_def::v1::{GetProfileRequest, GetProfileResponse};
use crate::grpc::defs::user_def::v1::{
    ExtendedStatus as UserStatus, StatusDuration, StatusVisibility,
};
use crate::grpc::service::GrpcService;
use crate::utils::generate_connection_url::generate_connection_url;
use serde::Deserialize;
use sqlx::FromRow;
use time::OffsetDateTime;
use tonic::{Request, Response, Status};
use uuid::Uuid;

#[derive(sqlx::Type, Debug, Deserialize)]
struct ProfileConnection {
    provider: i16,
    provider_identifier: String,
    display_name: String,
}

#[derive(Debug, FromRow)]
struct Profile {
    id: i64,
    name: String,
    username: String,
    bio: String,
    rendered_bio: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    banner_id: Option<Uuid>,
    banner_hex: Option<String>,
    location: String,
    public_flags: i32,
    is_private: bool,
    // Timestamps
    created_at: OffsetDateTime,
    // Stats
    story_count: i32,
    follower_count: i32,
    // Depends on `following_list_visibility`
    following_count: Option<i32>,
    // Depends on `friend_list_visibility`
    friend_count: Option<i32>,
    // Joins
    connections: Vec<ProfileConnection>,
    // Status
    has_status: bool,
    status_duration: Option<i16>,
    status_emoji: Option<String>,
    status_text: Option<String>,
    status_expires_at: Option<OffsetDateTime>,
    status_visibility: Option<i16>,
    // Boolean flags
    is_following: bool,
    is_follower: bool,
    is_friend: bool,
    is_subscribed: bool,
    is_friend_request_sent: bool,
    is_blocked_by_user: bool,
    is_blocking: bool,
    is_muted: bool,
}

/// Returns the user profile object.
pub async fn get_profile(
    client: &GrpcService,
    request: Request<GetProfileRequest>,
) -> Result<Response<GetProfileResponse>, Status> {
    let request = request.into_inner();
    let username = request.username;

    let current_user_id = {
        if let Some(user_id) = request.current_user_id {
            let value = user_id
                .parse::<i64>()
                .map_err(|_| Status::invalid_argument("`current_user_id` is invalid"))?;

            Some(value)
        } else {
            None
        }
    };

    let result = {
        if let Some(user_id) = current_user_id {
            sqlx::query_file_as!(
                Profile,
                "queries/grpc/get_profile/logged_in.sql",
                username,
                user_id
            )
            .fetch_one(&client.db_pool)
            .await
        } else {
            sqlx::query_file_as!(Profile, "queries/grpc/get_profile/default.sql", username)
                .fetch_one(&client.db_pool)
                .await
        }
    };

    if let Err(ref err) = result {
        if matches!(err, sqlx::Error::RowNotFound) {
            return Err(Status::not_found("User not found"));
        }

        return Err(Status::internal("Database error"));
    }

    let profile = result.unwrap();

    Ok(Response::new(GetProfileResponse {
        id: profile.id.to_string(),
        name: profile.name,
        username: profile.username,
        status: if profile.has_status {
            Some(UserStatus {
                emoji: profile.status_emoji,
                text: profile.status_text,
                expires_at: profile
                    .status_expires_at
                    .and_then(|value| Some(value.to_string())),
                duration: profile
                    .status_duration
                    .unwrap_or(StatusDuration::Day1 as i16) as i32,
                visibility: profile
                    .status_visibility
                    .unwrap_or(StatusVisibility::Global as i16) as i32,
            })
        } else {
            None
        },
        bio: Some(profile.bio),
        rendered_bio: Some(profile.rendered_bio),
        avatar_id: profile.avatar_id.and_then(|value| Some(value.to_string())),
        avatar_hex: profile.avatar_hex,
        banner_id: profile.banner_id.and_then(|value| Some(value.to_string())),
        banner_hex: profile.banner_hex,
        location: profile.location,
        created_at: profile.created_at.to_string(),
        public_flags: profile.public_flags as u32,
        story_count: profile.story_count as u32,
        follower_count: profile.follower_count as u32,
        following_count: profile.following_count.and_then(|value| Some(value as u32)),
        friend_count: profile.friend_count.and_then(|value| Some(value as u32)),
        is_private: profile.is_private,
        connections: profile
            .connections
            .iter()
            .map(|connection| Connection {
                provider: connection.provider as i32,
                url: generate_connection_url(
                    Provider::try_from(connection.provider as i32).unwrap_or(Provider::Unspecified),
                    &connection.provider_identifier,
                ),
                display_name: connection.display_name.to_string(),
            })
            .collect::<Vec<_>>(),
        is_following: profile.is_following,
        is_follower: profile.is_follower,
        is_friend: profile.is_friend,
        is_subscribed: profile.is_subscribed,
        is_friend_request_sent: profile.is_friend_request_sent,
        is_blocked_by_user: profile.is_blocked_by_user,
        is_blocking: profile.is_blocking,
        is_muted: profile.is_muted,
        is_self: current_user_id.is_some_and(|user_id| user_id == profile.id),
    }))
}

#[cfg(test)]
mod tests {
    use crate::grpc::defs::profile_def::v1::GetProfileRequest;
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use tonic::{Code, Request};

    // Logged-out

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_profile(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn should_not_return_soft_deleted_user_profile(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _| async move {
                // Soft-delete the user
                let result = sqlx::query(
                    r#"
                    UPDATE users
                    SET deleted_at = now()
                    WHERE id = $1
                    "#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn should_not_return_deactivated_user_profile(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _| async move {
                // Deactivate the user
                let result = sqlx::query(
                    r#"
                    UPDATE users
                    SET deactivated_at = now()
                    WHERE id = $1
                    "#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    // Logged-in

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.and_then(|value| Some(value.to_string())),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn should_not_return_soft_deleted_user_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, user_id| async move {
                // Soft-delete the user
                let result = sqlx::query(
                    r#"
                    UPDATE users
                    SET deleted_at = now()
                    WHERE id = $1
                    "#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.and_then(|value| Some(value.to_string())),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn should_not_return_deactivated_user_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, user_id| async move {
                // Deactivate the user
                let result = sqlx::query(
                    r#"
                    UPDATE users
                    SET deactivated_at = now()
                    WHERE id = $1
                    "#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.and_then(|value| Some(value.to_string())),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
