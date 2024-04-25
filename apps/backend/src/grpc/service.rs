use crate::{
    config,
    grpc::{
        defs::{
            blog_def::v1::{
                GetBlogArchiveRequest,
                GetBlogArchiveResponse,
                GetBlogEditorsInfoRequest,
                GetBlogEditorsInfoResponse,
                GetBlogNewsletterInfoRequest,
                GetBlogNewsletterInfoResponse,
                GetBlogNewsletterRequest,
                GetBlogNewsletterResponse,
                GetBlogPendingStoryCountRequest,
                GetBlogPendingStoryCountResponse,
                GetBlogPublishedStoryCountRequest,
                GetBlogPublishedStoryCountResponse,
                GetBlogRequest,
                GetBlogResponse,
                GetBlogSitemapRequest,
                GetBlogSitemapResponse,
                GetBlogWritersInfoRequest,
                GetBlogWritersInfoResponse,
                GetUserBlogsInfoRequest,
                GetUserBlogsInfoResponse,
            },
            comment_def::v1::{
                GetCommentRequest,
                GetCommentResponse,
            },
            connection_settings_def::v1::{
                GetConnectionSettingsRequest,
                GetConnectionSettingsResponse,
            },
            credential_settings_def::v1::{
                GetCredentialSettingsRequest,
                GetCredentialSettingsResponse,
            },
            grpc_service::v1::api_service_server::ApiService,
            login_activity_def::v1::{
                GetLoginActivityRequest,
                GetLoginActivityResponse,
            },
            notification_settings_def::v1::{
                GetNotificationSettingsRequest,
                GetNotificationSettingsResponse,
            },
            open_graph_def::v1::{
                GetStoryOpenGraphDataRequest,
                GetStoryOpenGraphDataResponse,
                GetTagOpenGraphDataRequest,
                GetTagOpenGraphDataResponse,
            },
            privacy_settings_def::v1::{
                GetPrivacySettingsRequest,
                GetPrivacySettingsResponse,
            },
            profile_def::v1::{
                GetProfileRequest,
                GetProfileResponse,
            },
            response_def::v1::{
                GetResponsesInfoRequest,
                GetResponsesInfoResponse,
                GetStoryResponsesInfoRequest,
                GetStoryResponsesInfoResponse,
            },
            story_def::v1::{
                CreateDraftRequest,
                CreateDraftResponse,
                GetContributionsInfoRequest,
                GetContributionsInfoResponse,
                GetDraftsInfoRequest,
                GetDraftsInfoResponse,
                GetStoriesInfoRequest,
                GetStoriesInfoResponse,
                GetStoryMetadataRequest,
                GetStoryMetadataResponse,
                GetStoryRequest,
                GetStoryResponse,
                ValidateStoryRequest,
                ValidateStoryResponse,
            },
            tag_def::v1::{
                GetFollowedTagCountRequest,
                GetFollowedTagCountResponse,
                GetTagRequest,
                GetTagResponse,
            },
            token_def::v1::{
                GetTokenRequest,
                GetTokenResponse,
                VerifyEmailRequest,
                VerifyEmailResponse,
                VerifyNewsletterSubscriptionRequest,
                VerifyNewsletterSubscriptionResponse,
            },
            user_def::v1::{
                GetUserBlockCountRequest,
                GetUserBlockCountResponse,
                GetUserIdRequest,
                GetUserIdResponse,
                GetUserMuteCountRequest,
                GetUserMuteCountResponse,
                GetUserRelationsInfoRequest,
                GetUserRelationsInfoResponse,
                GetUsernameRequest,
                GetUsernameResponse,
            },
        },
        endpoints,
    },
    RedisPool,
};
use sqlx::{
    Pool,
    Postgres,
};
use tonic::{
    Request,
    Response,
    Status,
};

/// The GRPC service.
#[derive(Clone)]
pub struct GrpcService {
    /// The environment configuration.
    pub config: config::Config,
    /// The Postgres connection pool.
    pub db_pool: Pool<Postgres>,
    /// The Redis connection instance.
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

    async fn get_username(
        &self,
        request: Request<GetUsernameRequest>,
    ) -> Result<Response<GetUsernameResponse>, Status> {
        endpoints::get_username::get_username(self, request).await
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
        endpoints::get_login_activity::get_login_activity(self, request).await
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

    async fn get_contributions_info(
        &self,
        request: Request<GetContributionsInfoRequest>,
    ) -> Result<Response<GetContributionsInfoResponse>, Status> {
        endpoints::get_contributions_info::get_contributions_info(self, request).await
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

    async fn get_story_metadata(
        &self,
        request: Request<GetStoryMetadataRequest>,
    ) -> Result<Response<GetStoryMetadataResponse>, Status> {
        endpoints::get_story_metadata::get_story_metadata(self, request).await
    }

    async fn get_comment(
        &self,
        request: Request<GetCommentRequest>,
    ) -> Result<Response<GetCommentResponse>, Status> {
        endpoints::get_comment::get_comment(self, request).await
    }

    async fn create_draft(
        &self,
        request: Request<CreateDraftRequest>,
    ) -> Result<Response<CreateDraftResponse>, Status> {
        endpoints::create_draft::create_draft(self, request).await
    }

    async fn validate_story(
        &self,
        request: Request<ValidateStoryRequest>,
    ) -> Result<Response<ValidateStoryResponse>, Status> {
        endpoints::validate_story::validate_story(self, request).await
    }

    async fn get_blog(
        &self,
        request: Request<GetBlogRequest>,
    ) -> Result<Response<GetBlogResponse>, Status> {
        endpoints::get_blog::get_blog(self, request).await
    }

    async fn get_blog_archive(
        &self,
        request: Request<GetBlogArchiveRequest>,
    ) -> Result<Response<GetBlogArchiveResponse>, Status> {
        endpoints::get_blog_archive::get_blog_archive(self, request).await
    }

    async fn get_blog_editors_info(
        &self,
        request: Request<GetBlogEditorsInfoRequest>,
    ) -> Result<Response<GetBlogEditorsInfoResponse>, Status> {
        endpoints::get_blog_editors_info::get_blog_editors_info(self, request).await
    }

    async fn get_blog_pending_story_count(
        &self,
        request: Request<GetBlogPendingStoryCountRequest>,
    ) -> Result<Response<GetBlogPendingStoryCountResponse>, Status> {
        endpoints::get_blog_pending_story_count::get_blog_pending_story_count(self, request).await
    }

    async fn get_blog_published_story_count(
        &self,
        request: Request<GetBlogPublishedStoryCountRequest>,
    ) -> Result<Response<GetBlogPublishedStoryCountResponse>, Status> {
        endpoints::get_blog_published_story_count::get_blog_published_story_count(self, request)
            .await
    }

    async fn get_blog_sitemap(
        &self,
        request: Request<GetBlogSitemapRequest>,
    ) -> Result<Response<GetBlogSitemapResponse>, Status> {
        endpoints::get_blog_sitemap::get_blog_sitemap(self, request).await
    }

    async fn get_blog_writers_info(
        &self,
        request: Request<GetBlogWritersInfoRequest>,
    ) -> Result<Response<GetBlogWritersInfoResponse>, Status> {
        endpoints::get_blog_writers_info::get_blog_writers_info(self, request).await
    }

    async fn get_user_blogs_info(
        &self,
        request: Request<GetUserBlogsInfoRequest>,
    ) -> Result<Response<GetUserBlogsInfoResponse>, Status> {
        endpoints::get_user_blogs_info::get_user_blogs_info(self, request).await
    }

    async fn get_story_open_graph_data(
        &self,
        request: Request<GetStoryOpenGraphDataRequest>,
    ) -> Result<Response<GetStoryOpenGraphDataResponse>, Status> {
        endpoints::get_story_open_graph_data::get_story_open_graph_data(self, request).await
    }

    async fn get_tag_open_graph_data(
        &self,
        request: Request<GetTagOpenGraphDataRequest>,
    ) -> Result<Response<GetTagOpenGraphDataResponse>, Status> {
        endpoints::get_tag_open_graph_data::get_tag_open_graph_data(self, request).await
    }

    async fn verify_newsletter_subscription(
        &self,
        request: Request<VerifyNewsletterSubscriptionRequest>,
    ) -> Result<Response<VerifyNewsletterSubscriptionResponse>, Status> {
        endpoints::verify_newsletter_subscription::verify_newsletter_subscription(self, request)
            .await
    }

    async fn get_blog_newsletter(
        &self,
        request: Request<GetBlogNewsletterRequest>,
    ) -> Result<Response<GetBlogNewsletterResponse>, Status> {
        endpoints::get_blog_newsletter::get_blog_newsletter(self, request).await
    }

    async fn get_blog_newsletter_info(
        &self,
        request: Request<GetBlogNewsletterInfoRequest>,
    ) -> Result<Response<GetBlogNewsletterInfoResponse>, Status> {
        endpoints::get_blog_newsletter_info::get_blog_newsletter_info(self, request).await
    }
}
