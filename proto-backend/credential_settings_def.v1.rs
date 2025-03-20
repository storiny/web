// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetCredentialSettingsRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetCredentialSettingsResponse {
    #[prost(bool, tag="1")]
    pub has_password: bool,
    #[prost(bool, tag="2")]
    pub mfa_enabled: bool,
    #[prost(string, optional, tag="3")]
    pub login_apple_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub login_google_id: ::core::option::Option<::prost::alloc::string::String>,
}
// @@protoc_insertion_point(module)
