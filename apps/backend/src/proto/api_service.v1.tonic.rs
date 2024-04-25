// @generated
/// Generated client implementations.
pub mod api_service_client {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    /** Service definition
*/
    #[derive(Debug, Clone)]
    pub struct ApiServiceClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl ApiServiceClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> ApiServiceClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::BoxBody>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> ApiServiceClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::BoxBody>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
            >>::Error: Into<StdError> + Send + Sync,
        {
            ApiServiceClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_decoding_message_size(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_encoding_message_size(limit);
            self
        }
        /** *
 Checks whether the user is authenticated using the token from the session cookie
*/
        pub async fn get_user_id(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::user_def::v1::GetUserIdRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::user_def::v1::GetUserIdResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetUserId",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetUserId"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the username for a user by its ID
*/
        pub async fn get_username(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::user_def::v1::GetUsernameRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::user_def::v1::GetUsernameResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetUsername",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetUsername"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the profile page data for a user
*/
        pub async fn get_profile(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::profile_def::v1::GetProfileRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::profile_def::v1::GetProfileResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetProfile",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetProfile"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the tag page data for a tag
*/
        pub async fn get_tag(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::tag_def::v1::GetTagRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::tag_def::v1::GetTagResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetTag",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetTag"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the token using its identifier
*/
        pub async fn get_token(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::token_def::v1::GetTokenRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::token_def::v1::GetTokenResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetToken",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetToken"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Verifies a user's email using the provided token identifier
*/
        pub async fn verify_email(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::token_def::v1::VerifyEmailRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::token_def::v1::VerifyEmailResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/VerifyEmail",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "VerifyEmail"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Verifies a visitor's newsletter subscription request using the provided token identifier
*/
        pub async fn verify_newsletter_subscription(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::token_def::v1::VerifyNewsletterSubscriptionRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::token_def::v1::VerifyNewsletterSubscriptionResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/VerifyNewsletterSubscription",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "api_service.v1.ApiService",
                        "VerifyNewsletterSubscription",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's credentials settings
*/
        pub async fn get_credential_settings(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::credential_settings_def::v1::GetCredentialSettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::credential_settings_def::v1::GetCredentialSettingsResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetCredentialSettings",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetCredentialSettings"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's privacy settings
*/
        pub async fn get_privacy_settings(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::privacy_settings_def::v1::GetPrivacySettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::privacy_settings_def::v1::GetPrivacySettingsResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetPrivacySettings",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetPrivacySettings"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's notification settings
*/
        pub async fn get_notification_settings(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::notification_settings_def::v1::GetNotificationSettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::notification_settings_def::v1::GetNotificationSettingsResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetNotificationSettings",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "api_service.v1.ApiService",
                        "GetNotificationSettings",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's connection settings
*/
        pub async fn get_connection_settings(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::connection_settings_def::v1::GetConnectionSettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::connection_settings_def::v1::GetConnectionSettingsResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetConnectionSettings",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetConnectionSettings"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's login activity
*/
        pub async fn get_login_activity(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::login_activity_def::v1::GetLoginActivityRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::login_activity_def::v1::GetLoginActivityResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetLoginActivity",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetLoginActivity"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Validates a story
*/
        pub async fn validate_story(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::story_def::v1::ValidateStoryRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::ValidateStoryResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/ValidateStory",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "ValidateStory"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's drafts details
*/
        pub async fn get_drafts_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::story_def::v1::GetDraftsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::GetDraftsInfoResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetDraftsInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetDraftsInfo"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's stories details
*/
        pub async fn get_stories_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::story_def::v1::GetStoriesInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::GetStoriesInfoResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetStoriesInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetStoriesInfo"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's contributions details
*/
        pub async fn get_contributions_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::story_def::v1::GetContributionsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::story_def::v1::GetContributionsInfoResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetContributionsInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetContributionsInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's responses details
*/
        pub async fn get_responses_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::response_def::v1::GetResponsesInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::response_def::v1::GetResponsesInfoResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetResponsesInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetResponsesInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the story's responses details
*/
        pub async fn get_story_responses_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::response_def::v1::GetStoryResponsesInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::response_def::v1::GetStoryResponsesInfoResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetStoryResponsesInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetStoryResponsesInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's followed tag count
*/
        pub async fn get_followed_tag_count(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::tag_def::v1::GetFollowedTagCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::tag_def::v1::GetFollowedTagCountResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetFollowedTagCount",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetFollowedTagCount"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's relations details
*/
        pub async fn get_user_relations_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::user_def::v1::GetUserRelationsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::user_def::v1::GetUserRelationsInfoResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetUserRelationsInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetUserRelationsInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's blogs details
*/
        pub async fn get_user_blogs_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetUserBlogsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetUserBlogsInfoResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetUserBlogsInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetUserBlogsInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's block count
*/
        pub async fn get_user_block_count(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::user_def::v1::GetUserBlockCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::user_def::v1::GetUserBlockCountResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetUserBlockCount",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetUserBlockCount"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the user's mute count
*/
        pub async fn get_user_mute_count(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::user_def::v1::GetUserMuteCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::user_def::v1::GetUserMuteCountResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetUserMuteCount",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetUserMuteCount"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the story's data
*/
        pub async fn get_story(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::story_def::v1::GetStoryRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::GetStoryResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetStory",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetStory"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the story's metadata
*/
        pub async fn get_story_metadata(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::story_def::v1::GetStoryMetadataRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::story_def::v1::GetStoryMetadataResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetStoryMetadata",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetStoryMetadata"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the comment's data
*/
        pub async fn get_comment(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::comment_def::v1::GetCommentRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::comment_def::v1::GetCommentResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetComment",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetComment"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Creates a new draft
*/
        pub async fn create_draft(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::story_def::v1::CreateDraftRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::CreateDraftResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/CreateDraft",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "CreateDraft"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's data
*/
        pub async fn get_blog(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetBlogResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlog",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetBlog"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's archive data
*/
        pub async fn get_blog_archive(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogArchiveRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetBlogArchiveResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogArchive",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetBlogArchive"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's pending story count
*/
        pub async fn get_blog_pending_story_count(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogPendingStoryCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogPendingStoryCountResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogPendingStoryCount",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "api_service.v1.ApiService",
                        "GetBlogPendingStoryCount",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's published story count
*/
        pub async fn get_blog_published_story_count(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogPublishedStoryCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogPublishedStoryCountResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogPublishedStoryCount",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "api_service.v1.ApiService",
                        "GetBlogPublishedStoryCount",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's editors details
*/
        pub async fn get_blog_editors_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogEditorsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogEditorsInfoResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogEditorsInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetBlogEditorsInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's writers details
*/
        pub async fn get_blog_writers_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogWritersInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogWritersInfoResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogWritersInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetBlogWritersInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's sitemap
*/
        pub async fn get_blog_sitemap(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogSitemapRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetBlogSitemapResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogSitemap",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("api_service.v1.ApiService", "GetBlogSitemap"));
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's newsletter
*/
        pub async fn get_blog_newsletter(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogNewsletterRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogNewsletterResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogNewsletter",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetBlogNewsletter"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the blog's newsletter details
*/
        pub async fn get_blog_newsletter_info(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::blog_def::v1::GetBlogNewsletterInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogNewsletterInfoResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetBlogNewsletterInfo",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetBlogNewsletterInfo"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the story's open graph data
*/
        pub async fn get_story_open_graph_data(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::open_graph_def::v1::GetStoryOpenGraphDataRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::open_graph_def::v1::GetStoryOpenGraphDataResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetStoryOpenGraphData",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetStoryOpenGraphData"),
                );
            self.inner.unary(req, path, codec).await
        }
        /** *
 Returns the tag's open graph data
*/
        pub async fn get_tag_open_graph_data(
            &mut self,
            request: impl tonic::IntoRequest<
                super::super::super::open_graph_def::v1::GetTagOpenGraphDataRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::open_graph_def::v1::GetTagOpenGraphDataResponse,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/api_service.v1.ApiService/GetTagOpenGraphData",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("api_service.v1.ApiService", "GetTagOpenGraphData"),
                );
            self.inner.unary(req, path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod api_service_server {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with ApiServiceServer.
    #[async_trait]
    pub trait ApiService: Send + Sync + 'static {
        /** *
 Checks whether the user is authenticated using the token from the session cookie
*/
        async fn get_user_id(
            &self,
            request: tonic::Request<super::super::super::user_def::v1::GetUserIdRequest>,
        ) -> std::result::Result<
            tonic::Response<super::super::super::user_def::v1::GetUserIdResponse>,
            tonic::Status,
        >;
        /** *
 Returns the username for a user by its ID
*/
        async fn get_username(
            &self,
            request: tonic::Request<
                super::super::super::user_def::v1::GetUsernameRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::user_def::v1::GetUsernameResponse>,
            tonic::Status,
        >;
        /** *
 Returns the profile page data for a user
*/
        async fn get_profile(
            &self,
            request: tonic::Request<
                super::super::super::profile_def::v1::GetProfileRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::profile_def::v1::GetProfileResponse>,
            tonic::Status,
        >;
        /** *
 Returns the tag page data for a tag
*/
        async fn get_tag(
            &self,
            request: tonic::Request<super::super::super::tag_def::v1::GetTagRequest>,
        ) -> std::result::Result<
            tonic::Response<super::super::super::tag_def::v1::GetTagResponse>,
            tonic::Status,
        >;
        /** *
 Returns the token using its identifier
*/
        async fn get_token(
            &self,
            request: tonic::Request<super::super::super::token_def::v1::GetTokenRequest>,
        ) -> std::result::Result<
            tonic::Response<super::super::super::token_def::v1::GetTokenResponse>,
            tonic::Status,
        >;
        /** *
 Verifies a user's email using the provided token identifier
*/
        async fn verify_email(
            &self,
            request: tonic::Request<
                super::super::super::token_def::v1::VerifyEmailRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::token_def::v1::VerifyEmailResponse>,
            tonic::Status,
        >;
        /** *
 Verifies a visitor's newsletter subscription request using the provided token identifier
*/
        async fn verify_newsletter_subscription(
            &self,
            request: tonic::Request<
                super::super::super::token_def::v1::VerifyNewsletterSubscriptionRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::token_def::v1::VerifyNewsletterSubscriptionResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's credentials settings
*/
        async fn get_credential_settings(
            &self,
            request: tonic::Request<
                super::super::super::credential_settings_def::v1::GetCredentialSettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::credential_settings_def::v1::GetCredentialSettingsResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's privacy settings
*/
        async fn get_privacy_settings(
            &self,
            request: tonic::Request<
                super::super::super::privacy_settings_def::v1::GetPrivacySettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::privacy_settings_def::v1::GetPrivacySettingsResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's notification settings
*/
        async fn get_notification_settings(
            &self,
            request: tonic::Request<
                super::super::super::notification_settings_def::v1::GetNotificationSettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::notification_settings_def::v1::GetNotificationSettingsResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's connection settings
*/
        async fn get_connection_settings(
            &self,
            request: tonic::Request<
                super::super::super::connection_settings_def::v1::GetConnectionSettingsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::connection_settings_def::v1::GetConnectionSettingsResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's login activity
*/
        async fn get_login_activity(
            &self,
            request: tonic::Request<
                super::super::super::login_activity_def::v1::GetLoginActivityRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::login_activity_def::v1::GetLoginActivityResponse,
            >,
            tonic::Status,
        >;
        /** *
 Validates a story
*/
        async fn validate_story(
            &self,
            request: tonic::Request<
                super::super::super::story_def::v1::ValidateStoryRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::ValidateStoryResponse>,
            tonic::Status,
        >;
        /** *
 Returns the user's drafts details
*/
        async fn get_drafts_info(
            &self,
            request: tonic::Request<
                super::super::super::story_def::v1::GetDraftsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::GetDraftsInfoResponse>,
            tonic::Status,
        >;
        /** *
 Returns the user's stories details
*/
        async fn get_stories_info(
            &self,
            request: tonic::Request<
                super::super::super::story_def::v1::GetStoriesInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::GetStoriesInfoResponse>,
            tonic::Status,
        >;
        /** *
 Returns the user's contributions details
*/
        async fn get_contributions_info(
            &self,
            request: tonic::Request<
                super::super::super::story_def::v1::GetContributionsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::story_def::v1::GetContributionsInfoResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's responses details
*/
        async fn get_responses_info(
            &self,
            request: tonic::Request<
                super::super::super::response_def::v1::GetResponsesInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::response_def::v1::GetResponsesInfoResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the story's responses details
*/
        async fn get_story_responses_info(
            &self,
            request: tonic::Request<
                super::super::super::response_def::v1::GetStoryResponsesInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::response_def::v1::GetStoryResponsesInfoResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's followed tag count
*/
        async fn get_followed_tag_count(
            &self,
            request: tonic::Request<
                super::super::super::tag_def::v1::GetFollowedTagCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::tag_def::v1::GetFollowedTagCountResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's relations details
*/
        async fn get_user_relations_info(
            &self,
            request: tonic::Request<
                super::super::super::user_def::v1::GetUserRelationsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::user_def::v1::GetUserRelationsInfoResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's blogs details
*/
        async fn get_user_blogs_info(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetUserBlogsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetUserBlogsInfoResponse>,
            tonic::Status,
        >;
        /** *
 Returns the user's block count
*/
        async fn get_user_block_count(
            &self,
            request: tonic::Request<
                super::super::super::user_def::v1::GetUserBlockCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::user_def::v1::GetUserBlockCountResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the user's mute count
*/
        async fn get_user_mute_count(
            &self,
            request: tonic::Request<
                super::super::super::user_def::v1::GetUserMuteCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::user_def::v1::GetUserMuteCountResponse>,
            tonic::Status,
        >;
        /** *
 Returns the story's data
*/
        async fn get_story(
            &self,
            request: tonic::Request<super::super::super::story_def::v1::GetStoryRequest>,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::GetStoryResponse>,
            tonic::Status,
        >;
        /** *
 Returns the story's metadata
*/
        async fn get_story_metadata(
            &self,
            request: tonic::Request<
                super::super::super::story_def::v1::GetStoryMetadataRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::story_def::v1::GetStoryMetadataResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the comment's data
*/
        async fn get_comment(
            &self,
            request: tonic::Request<
                super::super::super::comment_def::v1::GetCommentRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::comment_def::v1::GetCommentResponse>,
            tonic::Status,
        >;
        /** *
 Creates a new draft
*/
        async fn create_draft(
            &self,
            request: tonic::Request<
                super::super::super::story_def::v1::CreateDraftRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::story_def::v1::CreateDraftResponse>,
            tonic::Status,
        >;
        /** *
 Returns the blog's data
*/
        async fn get_blog(
            &self,
            request: tonic::Request<super::super::super::blog_def::v1::GetBlogRequest>,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetBlogResponse>,
            tonic::Status,
        >;
        /** *
 Returns the blog's archive data
*/
        async fn get_blog_archive(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogArchiveRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetBlogArchiveResponse>,
            tonic::Status,
        >;
        /** *
 Returns the blog's pending story count
*/
        async fn get_blog_pending_story_count(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogPendingStoryCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogPendingStoryCountResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the blog's published story count
*/
        async fn get_blog_published_story_count(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogPublishedStoryCountRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogPublishedStoryCountResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the blog's editors details
*/
        async fn get_blog_editors_info(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogEditorsInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogEditorsInfoResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the blog's writers details
*/
        async fn get_blog_writers_info(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogWritersInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogWritersInfoResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the blog's sitemap
*/
        async fn get_blog_sitemap(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogSitemapRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::super::super::blog_def::v1::GetBlogSitemapResponse>,
            tonic::Status,
        >;
        /** *
 Returns the blog's newsletter
*/
        async fn get_blog_newsletter(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogNewsletterRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogNewsletterResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the blog's newsletter details
*/
        async fn get_blog_newsletter_info(
            &self,
            request: tonic::Request<
                super::super::super::blog_def::v1::GetBlogNewsletterInfoRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::blog_def::v1::GetBlogNewsletterInfoResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the story's open graph data
*/
        async fn get_story_open_graph_data(
            &self,
            request: tonic::Request<
                super::super::super::open_graph_def::v1::GetStoryOpenGraphDataRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::open_graph_def::v1::GetStoryOpenGraphDataResponse,
            >,
            tonic::Status,
        >;
        /** *
 Returns the tag's open graph data
*/
        async fn get_tag_open_graph_data(
            &self,
            request: tonic::Request<
                super::super::super::open_graph_def::v1::GetTagOpenGraphDataRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<
                super::super::super::open_graph_def::v1::GetTagOpenGraphDataResponse,
            >,
            tonic::Status,
        >;
    }
    /** Service definition
*/
    #[derive(Debug)]
    pub struct ApiServiceServer<T: ApiService> {
        inner: _Inner<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
        max_decoding_message_size: Option<usize>,
        max_encoding_message_size: Option<usize>,
    }
    struct _Inner<T>(Arc<T>);
    impl<T: ApiService> ApiServiceServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            let inner = _Inner(inner);
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
                max_decoding_message_size: None,
                max_encoding_message_size: None,
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.max_decoding_message_size = Some(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.max_encoding_message_size = Some(limit);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for ApiServiceServer<T>
    where
        T: ApiService,
        B: Body + Send + 'static,
        B::Error: Into<StdError> + Send + 'static,
    {
        type Response = http::Response<tonic::body::BoxBody>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<std::result::Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            let inner = self.inner.clone();
            match req.uri().path() {
                "/api_service.v1.ApiService/GetUserId" => {
                    #[allow(non_camel_case_types)]
                    struct GetUserIdSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::user_def::v1::GetUserIdRequest,
                    > for GetUserIdSvc<T> {
                        type Response = super::super::super::user_def::v1::GetUserIdResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::user_def::v1::GetUserIdRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_user_id(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetUserIdSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetUsername" => {
                    #[allow(non_camel_case_types)]
                    struct GetUsernameSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::user_def::v1::GetUsernameRequest,
                    > for GetUsernameSvc<T> {
                        type Response = super::super::super::user_def::v1::GetUsernameResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::user_def::v1::GetUsernameRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_username(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetUsernameSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetProfile" => {
                    #[allow(non_camel_case_types)]
                    struct GetProfileSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::profile_def::v1::GetProfileRequest,
                    > for GetProfileSvc<T> {
                        type Response = super::super::super::profile_def::v1::GetProfileResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::profile_def::v1::GetProfileRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_profile(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetProfileSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetTag" => {
                    #[allow(non_camel_case_types)]
                    struct GetTagSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::tag_def::v1::GetTagRequest,
                    > for GetTagSvc<T> {
                        type Response = super::super::super::tag_def::v1::GetTagResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::tag_def::v1::GetTagRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_tag(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetTagSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetToken" => {
                    #[allow(non_camel_case_types)]
                    struct GetTokenSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::token_def::v1::GetTokenRequest,
                    > for GetTokenSvc<T> {
                        type Response = super::super::super::token_def::v1::GetTokenResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::token_def::v1::GetTokenRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_token(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetTokenSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/VerifyEmail" => {
                    #[allow(non_camel_case_types)]
                    struct VerifyEmailSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::token_def::v1::VerifyEmailRequest,
                    > for VerifyEmailSvc<T> {
                        type Response = super::super::super::token_def::v1::VerifyEmailResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::token_def::v1::VerifyEmailRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).verify_email(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = VerifyEmailSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/VerifyNewsletterSubscription" => {
                    #[allow(non_camel_case_types)]
                    struct VerifyNewsletterSubscriptionSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::token_def::v1::VerifyNewsletterSubscriptionRequest,
                    > for VerifyNewsletterSubscriptionSvc<T> {
                        type Response = super::super::super::token_def::v1::VerifyNewsletterSubscriptionResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::token_def::v1::VerifyNewsletterSubscriptionRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).verify_newsletter_subscription(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = VerifyNewsletterSubscriptionSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetCredentialSettings" => {
                    #[allow(non_camel_case_types)]
                    struct GetCredentialSettingsSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::credential_settings_def::v1::GetCredentialSettingsRequest,
                    > for GetCredentialSettingsSvc<T> {
                        type Response = super::super::super::credential_settings_def::v1::GetCredentialSettingsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::credential_settings_def::v1::GetCredentialSettingsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_credential_settings(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetCredentialSettingsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetPrivacySettings" => {
                    #[allow(non_camel_case_types)]
                    struct GetPrivacySettingsSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::privacy_settings_def::v1::GetPrivacySettingsRequest,
                    > for GetPrivacySettingsSvc<T> {
                        type Response = super::super::super::privacy_settings_def::v1::GetPrivacySettingsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::privacy_settings_def::v1::GetPrivacySettingsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_privacy_settings(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetPrivacySettingsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetNotificationSettings" => {
                    #[allow(non_camel_case_types)]
                    struct GetNotificationSettingsSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::notification_settings_def::v1::GetNotificationSettingsRequest,
                    > for GetNotificationSettingsSvc<T> {
                        type Response = super::super::super::notification_settings_def::v1::GetNotificationSettingsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::notification_settings_def::v1::GetNotificationSettingsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_notification_settings(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetNotificationSettingsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetConnectionSettings" => {
                    #[allow(non_camel_case_types)]
                    struct GetConnectionSettingsSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::connection_settings_def::v1::GetConnectionSettingsRequest,
                    > for GetConnectionSettingsSvc<T> {
                        type Response = super::super::super::connection_settings_def::v1::GetConnectionSettingsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::connection_settings_def::v1::GetConnectionSettingsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_connection_settings(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetConnectionSettingsSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetLoginActivity" => {
                    #[allow(non_camel_case_types)]
                    struct GetLoginActivitySvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::login_activity_def::v1::GetLoginActivityRequest,
                    > for GetLoginActivitySvc<T> {
                        type Response = super::super::super::login_activity_def::v1::GetLoginActivityResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::login_activity_def::v1::GetLoginActivityRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_login_activity(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetLoginActivitySvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/ValidateStory" => {
                    #[allow(non_camel_case_types)]
                    struct ValidateStorySvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::story_def::v1::ValidateStoryRequest,
                    > for ValidateStorySvc<T> {
                        type Response = super::super::super::story_def::v1::ValidateStoryResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::story_def::v1::ValidateStoryRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).validate_story(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = ValidateStorySvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetDraftsInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetDraftsInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::story_def::v1::GetDraftsInfoRequest,
                    > for GetDraftsInfoSvc<T> {
                        type Response = super::super::super::story_def::v1::GetDraftsInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::story_def::v1::GetDraftsInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_drafts_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetDraftsInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetStoriesInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetStoriesInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::story_def::v1::GetStoriesInfoRequest,
                    > for GetStoriesInfoSvc<T> {
                        type Response = super::super::super::story_def::v1::GetStoriesInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::story_def::v1::GetStoriesInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_stories_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetStoriesInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetContributionsInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetContributionsInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::story_def::v1::GetContributionsInfoRequest,
                    > for GetContributionsInfoSvc<T> {
                        type Response = super::super::super::story_def::v1::GetContributionsInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::story_def::v1::GetContributionsInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_contributions_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetContributionsInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetResponsesInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetResponsesInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::response_def::v1::GetResponsesInfoRequest,
                    > for GetResponsesInfoSvc<T> {
                        type Response = super::super::super::response_def::v1::GetResponsesInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::response_def::v1::GetResponsesInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_responses_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetResponsesInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetStoryResponsesInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetStoryResponsesInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::response_def::v1::GetStoryResponsesInfoRequest,
                    > for GetStoryResponsesInfoSvc<T> {
                        type Response = super::super::super::response_def::v1::GetStoryResponsesInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::response_def::v1::GetStoryResponsesInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_story_responses_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetStoryResponsesInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetFollowedTagCount" => {
                    #[allow(non_camel_case_types)]
                    struct GetFollowedTagCountSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::tag_def::v1::GetFollowedTagCountRequest,
                    > for GetFollowedTagCountSvc<T> {
                        type Response = super::super::super::tag_def::v1::GetFollowedTagCountResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::tag_def::v1::GetFollowedTagCountRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_followed_tag_count(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetFollowedTagCountSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetUserRelationsInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetUserRelationsInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::user_def::v1::GetUserRelationsInfoRequest,
                    > for GetUserRelationsInfoSvc<T> {
                        type Response = super::super::super::user_def::v1::GetUserRelationsInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::user_def::v1::GetUserRelationsInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_user_relations_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetUserRelationsInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetUserBlogsInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetUserBlogsInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetUserBlogsInfoRequest,
                    > for GetUserBlogsInfoSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetUserBlogsInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetUserBlogsInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_user_blogs_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetUserBlogsInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetUserBlockCount" => {
                    #[allow(non_camel_case_types)]
                    struct GetUserBlockCountSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::user_def::v1::GetUserBlockCountRequest,
                    > for GetUserBlockCountSvc<T> {
                        type Response = super::super::super::user_def::v1::GetUserBlockCountResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::user_def::v1::GetUserBlockCountRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_user_block_count(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetUserBlockCountSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetUserMuteCount" => {
                    #[allow(non_camel_case_types)]
                    struct GetUserMuteCountSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::user_def::v1::GetUserMuteCountRequest,
                    > for GetUserMuteCountSvc<T> {
                        type Response = super::super::super::user_def::v1::GetUserMuteCountResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::user_def::v1::GetUserMuteCountRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_user_mute_count(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetUserMuteCountSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetStory" => {
                    #[allow(non_camel_case_types)]
                    struct GetStorySvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::story_def::v1::GetStoryRequest,
                    > for GetStorySvc<T> {
                        type Response = super::super::super::story_def::v1::GetStoryResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::story_def::v1::GetStoryRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_story(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetStorySvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetStoryMetadata" => {
                    #[allow(non_camel_case_types)]
                    struct GetStoryMetadataSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::story_def::v1::GetStoryMetadataRequest,
                    > for GetStoryMetadataSvc<T> {
                        type Response = super::super::super::story_def::v1::GetStoryMetadataResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::story_def::v1::GetStoryMetadataRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_story_metadata(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetStoryMetadataSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetComment" => {
                    #[allow(non_camel_case_types)]
                    struct GetCommentSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::comment_def::v1::GetCommentRequest,
                    > for GetCommentSvc<T> {
                        type Response = super::super::super::comment_def::v1::GetCommentResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::comment_def::v1::GetCommentRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_comment(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetCommentSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/CreateDraft" => {
                    #[allow(non_camel_case_types)]
                    struct CreateDraftSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::story_def::v1::CreateDraftRequest,
                    > for CreateDraftSvc<T> {
                        type Response = super::super::super::story_def::v1::CreateDraftResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::story_def::v1::CreateDraftRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).create_draft(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = CreateDraftSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlog" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogRequest,
                    > for GetBlogSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move { (*inner).get_blog(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogArchive" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogArchiveSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogArchiveRequest,
                    > for GetBlogArchiveSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogArchiveResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogArchiveRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_archive(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogArchiveSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogPendingStoryCount" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogPendingStoryCountSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogPendingStoryCountRequest,
                    > for GetBlogPendingStoryCountSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogPendingStoryCountResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogPendingStoryCountRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_pending_story_count(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogPendingStoryCountSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogPublishedStoryCount" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogPublishedStoryCountSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogPublishedStoryCountRequest,
                    > for GetBlogPublishedStoryCountSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogPublishedStoryCountResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogPublishedStoryCountRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_published_story_count(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogPublishedStoryCountSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogEditorsInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogEditorsInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogEditorsInfoRequest,
                    > for GetBlogEditorsInfoSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogEditorsInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogEditorsInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_editors_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogEditorsInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogWritersInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogWritersInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogWritersInfoRequest,
                    > for GetBlogWritersInfoSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogWritersInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogWritersInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_writers_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogWritersInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogSitemap" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogSitemapSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogSitemapRequest,
                    > for GetBlogSitemapSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogSitemapResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogSitemapRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_sitemap(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogSitemapSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogNewsletter" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogNewsletterSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogNewsletterRequest,
                    > for GetBlogNewsletterSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogNewsletterResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogNewsletterRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_newsletter(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogNewsletterSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetBlogNewsletterInfo" => {
                    #[allow(non_camel_case_types)]
                    struct GetBlogNewsletterInfoSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::blog_def::v1::GetBlogNewsletterInfoRequest,
                    > for GetBlogNewsletterInfoSvc<T> {
                        type Response = super::super::super::blog_def::v1::GetBlogNewsletterInfoResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::blog_def::v1::GetBlogNewsletterInfoRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_blog_newsletter_info(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetBlogNewsletterInfoSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetStoryOpenGraphData" => {
                    #[allow(non_camel_case_types)]
                    struct GetStoryOpenGraphDataSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::open_graph_def::v1::GetStoryOpenGraphDataRequest,
                    > for GetStoryOpenGraphDataSvc<T> {
                        type Response = super::super::super::open_graph_def::v1::GetStoryOpenGraphDataResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::open_graph_def::v1::GetStoryOpenGraphDataRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_story_open_graph_data(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetStoryOpenGraphDataSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/api_service.v1.ApiService/GetTagOpenGraphData" => {
                    #[allow(non_camel_case_types)]
                    struct GetTagOpenGraphDataSvc<T: ApiService>(pub Arc<T>);
                    impl<
                        T: ApiService,
                    > tonic::server::UnaryService<
                        super::super::super::open_graph_def::v1::GetTagOpenGraphDataRequest,
                    > for GetTagOpenGraphDataSvc<T> {
                        type Response = super::super::super::open_graph_def::v1::GetTagOpenGraphDataResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::super::super::open_graph_def::v1::GetTagOpenGraphDataRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                (*inner).get_tag_open_graph_data(request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = GetTagOpenGraphDataSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        Ok(
                            http::Response::builder()
                                .status(200)
                                .header("grpc-status", "12")
                                .header("content-type", "application/grpc")
                                .body(empty_body())
                                .unwrap(),
                        )
                    })
                }
            }
        }
    }
    impl<T: ApiService> Clone for ApiServiceServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
                max_decoding_message_size: self.max_decoding_message_size,
                max_encoding_message_size: self.max_encoding_message_size,
            }
        }
    }
    impl<T: ApiService> Clone for _Inner<T> {
        fn clone(&self) -> Self {
            Self(Arc::clone(&self.0))
        }
    }
    impl<T: std::fmt::Debug> std::fmt::Debug for _Inner<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{:?}", self.0)
        }
    }
    impl<T: ApiService> tonic::server::NamedService for ApiServiceServer<T> {
        const NAME: &'static str = "api_service.v1.ApiService";
    }
}
