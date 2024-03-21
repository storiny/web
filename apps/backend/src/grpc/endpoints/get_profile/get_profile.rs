use crate::{
    grpc::{
        defs::{
            connection_def::v1::Connection,
            profile_def::v1::{
                GetProfileRequest,
                GetProfileResponse,
            },
            user_def::v1::{
                ExtendedStatus as UserStatus,
                StatusDuration,
                StatusVisibility,
            },
        },
        service::GrpcService,
    },
    utils::{
        generate_connection_url::generate_connection_url,
        to_iso8601::to_iso8601,
    },
};
use serde::Deserialize;
use sqlx::FromRow;
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;
use uuid::Uuid;

#[derive(sqlx::Type, Debug, Deserialize)]
struct ProfileConnection {
    provider: String,
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
    is_blocked: bool,
    is_muted: bool,
    is_plus_member: bool,
}

/// Returns the user profile object.
#[tracing::instrument(
    name = "GRPC get_profile",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_profile(
    client: &GrpcService,
    request: Request<GetProfileRequest>,
) -> Result<Response<GetProfileResponse>, Status> {
    let request = request.into_inner();
    let username = request.username;
    let current_user_id = request
        .current_user_id
        .and_then(|user_id| user_id.parse::<i64>().ok());

    let profile = {
        if let Some(current_user_id) = current_user_id {
            tracing::Span::current().record("user_id", current_user_id);

            sqlx::query_file_as!(
                Profile,
                "queries/grpc/get_profile/logged_in.sql",
                username,
                current_user_id
            )
            .fetch_one(&client.db_pool)
            .await
        } else {
            sqlx::query_file_as!(Profile, "queries/grpc/get_profile/default.sql", username)
                .fetch_one(&client.db_pool)
                .await
        }
    }
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("User not found")
        } else {
            error!("unable to fetch the profile: {error:?}");

            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetProfileResponse {
        id: profile.id.to_string(),
        name: profile.name,
        username: profile.username,
        status: if profile.has_status {
            Some(UserStatus {
                emoji: profile.status_emoji,
                text: profile.status_text,
                expires_at: profile.status_expires_at.map(|value| to_iso8601(&value)),
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
        avatar_id: profile.avatar_id.map(|value| value.to_string()),
        avatar_hex: profile.avatar_hex,
        banner_id: profile.banner_id.map(|value| value.to_string()),
        banner_hex: profile.banner_hex,
        location: profile.location,
        created_at: to_iso8601(&profile.created_at),
        public_flags: profile.public_flags as u32,
        story_count: profile.story_count as u32,
        follower_count: profile.follower_count as u32,
        following_count: profile.following_count.map(|value| value as u32),
        friend_count: profile.friend_count.map(|value| value as u32),
        is_private: profile.is_private,
        connections: profile
            .connections
            .iter()
            .map(|connection| Connection {
                provider: connection.provider.to_string(),
                url: generate_connection_url(&connection.provider, &connection.provider_identifier),
                display_name: connection.display_name.to_string(),
            })
            .collect::<Vec<_>>(),
        is_following: profile.is_following,
        is_follower: profile.is_follower,
        is_friend: profile.is_friend,
        is_subscribed: profile.is_subscribed,
        is_friend_request_sent: profile.is_friend_request_sent,
        is_blocked_by_user: profile.is_blocked_by_user,
        is_blocked: profile.is_blocked,
        is_muted: profile.is_muted,
        is_self: current_user_id.is_some_and(|user_id| user_id == profile.id),
        is_plus_member: profile.is_plus_member,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::profile_def::v1::GetProfileRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::{
        Code,
        Request,
    };

    // Logged-out

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_profile(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                assert!(!response.is_following);
                assert!(!response.is_follower);
                assert!(!response.is_friend);
                assert!(!response.is_subscribed);
                assert!(!response.is_friend_request_sent);
                assert!(!response.is_blocked_by_user);
                assert!(!response.is_blocked);
                assert!(!response.is_muted);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn should_not_return_soft_deleted_user_profile(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the user.
                let result = sqlx::query(
                    r#"
UPDATE users
SET deleted_at = NOW()
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
            Box::new(|mut client, pool, _, _| async move {
                // Deactivate the user.
                let result = sqlx::query(
                    r#"
UPDATE users
SET deactivated_at = NOW()
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
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_is_following_flag_for_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_following);

                // Follow the user.
                let result = sqlx::query(
                    r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_following);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_is_follower_flag_for_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_follower);

                // Add the user as follower.
                let result = sqlx::query(
                    r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_follower);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_is_friend_and_is_friend_request_sent_flags_for_profile_when_logged_in(
        pool: PgPool,
    ) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_friend);
                assert!(!response.is_friend_request_sent);

                // Send a friend request.
                let result = sqlx::query(
                    r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be still be false as the request has not been accepted yet.
                assert!(!response.is_follower);
                // Friend request should be sent.
                assert!(response.is_friend_request_sent);

                // Accept the friend request.
                let result = sqlx::query(
                    r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_friend);
                // Friend request should get accepted.
                assert!(!response.is_friend_request_sent);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_is_subscribed_flag_for_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Follow the user without subscribing.
                let result = sqlx::query(
                    r#"
INSERT INTO relations (follower_id, followed_id, subscribed_at)
VALUES ($1, $2, NULL)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_subscribed);

                // Subscribe to the user.
                let result = sqlx::query(
                    r#"
UPDATE relations
SET subscribed_at = NOW()
WHERE follower_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_subscribed);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_is_blocked_by_user_flag_for_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_blocked_by_user);

                // Get blocked by the user.
                let result = sqlx::query(
                    r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($2, $1)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_blocked_by_user);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_is_blocked_flag_for_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_blocked);

                // Block the user.
                let result = sqlx::query(
                    r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_blocked);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn can_return_is_muted_flag_for_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_muted);

                // Mute the user.
                let result = sqlx::query(
                    r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_profile(Request::new(GetProfileRequest {
                        username: "target_user".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_muted);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_profile"))]
    async fn should_not_return_soft_deleted_user_profile_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the user.
                let result = sqlx::query(
                    r#"
UPDATE users
SET deleted_at = NOW()
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
                        current_user_id: user_id.map(|value| value.to_string()),
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
            Box::new(|mut client, pool, _, user_id| async move {
                // Deactivate the user.
                let result = sqlx::query(
                    r#"
UPDATE users
SET deactivated_at = NOW()
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
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
