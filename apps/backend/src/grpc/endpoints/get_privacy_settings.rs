use crate::grpc::{
    defs::privacy_settings_def::v1::{
        GetPrivacySettingsRequest,
        GetPrivacySettingsResponse,
    },
    service::GrpcService,
};
use sqlx::Row;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Returns the privacy settings for a user.
#[tracing::instrument(
    name = "GRPC get_privacy_settings",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_privacy_settings(
    client: &GrpcService,
    request: Request<GetPrivacySettingsRequest>,
) -> Result<Response<GetPrivacySettingsResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let user = sqlx::query(
        r#"
SELECT
    is_private,
    disable_read_history,
    allow_sensitive_content,
    incoming_friend_requests,
    incoming_collaboration_requests,
    incoming_blog_requests,
    following_list_visibility,
    friend_list_visibility
FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("User not found")
        } else {
            error!("database error: {error:?}");

            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetPrivacySettingsResponse {
        is_private_account: user.get::<bool, _>("is_private"),
        record_read_history: !user.get::<bool, _>("disable_read_history"),
        allow_sensitive_media: user.get::<bool, _>("allow_sensitive_content"),
        incoming_friend_requests: user.get::<i16, _>("incoming_friend_requests") as i32,
        incoming_collaboration_requests: user.get::<i16, _>("incoming_collaboration_requests")
            as i32,
        incoming_blog_requests: user.get::<i16, _>("incoming_blog_requests") as i32,
        following_list_visibility: user.get::<i16, _>("following_list_visibility") as i32,
        friend_list_visibility: user.get::<i16, _>("friend_list_visibility") as i32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::privacy_settings_def::v1::{
            GetPrivacySettingsRequest,
            GetPrivacySettingsResponse,
            IncomingBlogRequest,
            IncomingCollaborationRequest,
            IncomingFriendRequest,
            RelationVisibility,
        },
        test_utils::test_grpc_service,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use tonic::Request;

    #[sqlx::test]
    async fn can_return_privacy_settings(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Insert the user.
                let result = sqlx::query(
                    r#"
INSERT INTO users (
    name,
    username,
    email,
    is_private,
    disable_read_history,
    allow_sensitive_content,
    incoming_friend_requests,
    incoming_collaboration_requests,
    incoming_blog_requests,
    following_list_visibility,
    friend_list_visibility
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id
"#,
                )
                .bind("Some user".to_string())
                .bind("some_user".to_string())
                .bind("someone@example.com".to_string())
                .bind(true)
                .bind(true)
                .bind(true)
                .bind(IncomingFriendRequest::None as i16)
                .bind(IncomingCollaborationRequest::None as i16)
                .bind(IncomingBlogRequest::None as i16)
                .bind(RelationVisibility::None as i16)
                .bind(RelationVisibility::None as i16)
                .fetch_one(&pool)
                .await
                .unwrap();

                let user_id = result.get::<i64, _>("id");

                let response = client
                    .get_privacy_settings(Request::new(GetPrivacySettingsRequest {
                        user_id: user_id.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(
                    response,
                    GetPrivacySettingsResponse {
                        is_private_account: true,
                        record_read_history: false,
                        allow_sensitive_media: true,
                        incoming_friend_requests: IncomingFriendRequest::None as i32,
                        incoming_collaboration_requests: IncomingCollaborationRequest::None as i32,
                        incoming_blog_requests: IncomingBlogRequest::None as i32,
                        following_list_visibility: RelationVisibility::None as i32,
                        friend_list_visibility: RelationVisibility::None as i32,
                    }
                );
            }),
        )
        .await;
    }
}
