use crate::{
    config,
    grpc::{
        defs::{
            comment_def::v1::{GetCommentRequest, GetCommentResponse},
            connection_settings_def::v1::{
                GetConnectionSettingsRequest, GetConnectionSettingsResponse,
            },
            credential_settings_def::v1::{
                GetCredentialSettingsRequest, GetCredentialSettingsResponse,
            },
            grpc_service::v1::api_service_server::ApiService,
            login_activity_def::v1::{GetLoginActivityRequest, GetLoginActivityResponse},
            notification_settings_def::v1::{
                GetNotificationSettingsRequest, GetNotificationSettingsResponse,
            },
            privacy_settings_def::v1::{GetPrivacySettingsRequest, GetPrivacySettingsResponse},
            profile_def::v1::{GetProfileRequest, GetProfileResponse},
            response_def::v1::{
                GetResponsesInfoRequest, GetResponsesInfoResponse, GetStoryResponsesInfoRequest,
                GetStoryResponsesInfoResponse,
            },
            story_def::v1::{
                GetDraftsInfoRequest, GetDraftsInfoResponse, GetStoriesInfoRequest,
                GetStoriesInfoResponse, GetStoryRequest, GetStoryResponse,
            },
            tag_def::v1::{
                GetFollowedTagCountRequest, GetFollowedTagCountResponse, GetTagRequest,
                GetTagResponse,
            },
            token_def::v1::{
                GetTokenRequest, GetTokenResponse, VerifyEmailRequest, VerifyEmailResponse,
            },
            user_def::v1::{
                GetUserBlockCountRequest, GetUserBlockCountResponse, GetUserIdRequest,
                GetUserIdResponse, GetUserMuteCountRequest, GetUserMuteCountResponse,
                GetUserRelationsInfoRequest, GetUserRelationsInfoResponse,
            },
        },
        endpoints,
    },
};
use deadpool_redis::Pool as RedisPool;
use sqlx::{Pool, Postgres};
use tonic::{Request, Response, Status};

/// A GRPC service.
#[derive(Clone)]
pub struct GrpcService {
    /// Environment configuration
    pub config: config::Config,
    /// Postgres connection pool
    pub db_pool: Pool<Postgres>,
    /// Redis connection instance
    pub redis_pool: RedisPool,
}

#[tonic::async_trait]
impl ApiService for GrpcService {
    async fn get_user_id(
        &self,
        request: Request<GetUserIdRequest>,
    ) -> Result<Response<GetUserIdResponse>, Status> {
        endpoints::get_user_id::get_user_id(self, request).await
    }

    async fn get_profile(
        &self,
        request: Request<GetProfileRequest>,
    ) -> Result<Response<GetProfileResponse>, Status> {
        endpoints::get_profile::get_profile(self, request).await
    }

    async fn get_tag(
        &self,
        request: Request<GetTagRequest>,
    ) -> Result<Response<GetTagResponse>, Status> {
        endpoints::get_tag::get_tag(self, request).await
    }

    async fn get_token(
        &self,
        request: Request<GetTokenRequest>,
    ) -> Result<Response<GetTokenResponse>, Status> {
        endpoints::get_token::get_token(self, request).await
    }

    async fn verify_email(
        &self,
        request: Request<VerifyEmailRequest>,
    ) -> Result<Response<VerifyEmailResponse>, Status> {
        endpoints::verify_email::verify_email(self, request).await
    }

    async fn get_credential_settings(
        &self,
        request: Request<GetCredentialSettingsRequest>,
    ) -> Result<Response<GetCredentialSettingsResponse>, Status> {
        endpoints::get_credential_settings::get_credential_settings(self, request).await
    }

    async fn get_privacy_settings(
        &self,
        request: Request<GetPrivacySettingsRequest>,
    ) -> Result<Response<GetPrivacySettingsResponse>, Status> {
        endpoints::get_privacy_settings::get_privacy_settings(self, request).await
    }

    async fn get_notification_settings(
        &self,
        request: Request<GetNotificationSettingsRequest>,
    ) -> Result<Response<GetNotificationSettingsResponse>, Status> {
        endpoints::get_notification_settings::get_notification_settings(self, request).await
    }

    async fn get_connection_settings(
        &self,
        request: Request<GetConnectionSettingsRequest>,
    ) -> Result<Response<GetConnectionSettingsResponse>, Status> {
        endpoints::get_connection_settings::get_connection_settings(self, request).await
    }

    async fn get_login_activity(
        &self,
        request: Request<GetLoginActivityRequest>,
    ) -> Result<Response<GetLoginActivityResponse>, Status> {
        todo!()
    }

    async fn get_drafts_info(
        &self,
        request: Request<GetDraftsInfoRequest>,
    ) -> Result<Response<GetDraftsInfoResponse>, Status> {
        endpoints::get_drafts_info::get_drafts_info(self, request).await
    }

    async fn get_stories_info(
        &self,
        request: Request<GetStoriesInfoRequest>,
    ) -> Result<Response<GetStoriesInfoResponse>, Status> {
        endpoints::get_stories_info::get_stories_info(self, request).await
    }

    async fn get_responses_info(
        &self,
        request: Request<GetResponsesInfoRequest>,
    ) -> Result<Response<GetResponsesInfoResponse>, Status> {
        endpoints::get_responses_info::get_responses_info(self, request).await
    }

    async fn get_story_responses_info(
        &self,
        request: Request<GetStoryResponsesInfoRequest>,
    ) -> Result<Response<GetStoryResponsesInfoResponse>, Status> {
        endpoints::get_story_responses_info::get_story_responses_info(self, request).await
    }

    async fn get_followed_tag_count(
        &self,
        request: Request<GetFollowedTagCountRequest>,
    ) -> Result<Response<GetFollowedTagCountResponse>, Status> {
        endpoints::get_followed_tag_count::get_followed_tag_count(self, request).await
    }

    async fn get_user_relations_info(
        &self,
        request: Request<GetUserRelationsInfoRequest>,
    ) -> Result<Response<GetUserRelationsInfoResponse>, Status> {
        endpoints::get_user_relations_info::get_user_relations_info(self, request).await
    }

    async fn get_user_block_count(
        &self,
        request: Request<GetUserBlockCountRequest>,
    ) -> Result<Response<GetUserBlockCountResponse>, Status> {
        endpoints::get_user_block_count::get_user_block_count(self, request).await
    }

    async fn get_user_mute_count(
        &self,
        request: Request<GetUserMuteCountRequest>,
    ) -> Result<Response<GetUserMuteCountResponse>, Status> {
        endpoints::get_user_mute_count::get_user_mute_count(self, request).await
    }

    async fn get_story(
        &self,
        request: Request<GetStoryRequest>,
    ) -> Result<Response<GetStoryResponse>, Status> {
        endpoints::get_story::get_story(self, request).await
    }

    async fn get_comment(
        &self,
        request: Request<GetCommentRequest>,
    ) -> Result<Response<GetCommentResponse>, Status> {
        endpoints::get_comment::get_comment(self, request).await
    }
}
