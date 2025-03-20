// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetNotificationSettingsRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetNotificationSettingsResponse {
    /// Site notifications
    #[prost(bool, tag="1")]
    pub features_and_updates: bool,
    #[prost(bool, tag="2")]
    pub stories: bool,
    #[prost(bool, tag="3")]
    pub story_likes: bool,
    #[prost(bool, tag="4")]
    pub tags: bool,
    #[prost(bool, tag="5")]
    pub comments: bool,
    #[prost(bool, tag="6")]
    pub replies: bool,
    #[prost(bool, tag="7")]
    pub new_followers: bool,
    #[prost(bool, tag="8")]
    pub friend_requests: bool,
    #[prost(bool, tag="9")]
    pub collaboration_requests: bool,
    #[prost(bool, tag="10")]
    pub blog_requests: bool,
    /// Mail notifications
    #[prost(bool, tag="11")]
    pub mail_login_activity: bool,
    #[prost(bool, tag="12")]
    pub mail_features_and_updates: bool,
    #[prost(bool, tag="13")]
    pub mail_newsletters: bool,
    #[prost(bool, tag="14")]
    pub mail_digest: bool,
}
// @@protoc_insertion_point(module)
