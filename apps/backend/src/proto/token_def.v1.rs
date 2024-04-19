// @generated
// Get token

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetTokenRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
    #[prost(enumeration="TokenType", tag="2")]
    pub r#type: i32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetTokenResponse {
    #[prost(bool, tag="1")]
    pub is_valid: bool,
    #[prost(bool, tag="2")]
    pub is_expired: bool,
}
// E-mail verification

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VerifyEmailRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VerifyEmailResponse {
}
// Newsletter subscription

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VerifyNewsletterSubscriptionRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VerifyNewsletterSubscriptionResponse {
    #[prost(bool, tag="1")]
    pub is_valid: bool,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum TokenType {
    Unspecified = 0,
    EmailVerification = 1,
    PasswordReset = 2,
    PasswordAdd = 3,
}
impl TokenType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            TokenType::Unspecified => "TOKEN_TYPE_UNSPECIFIED",
            TokenType::EmailVerification => "TOKEN_TYPE_EMAIL_VERIFICATION",
            TokenType::PasswordReset => "TOKEN_TYPE_PASSWORD_RESET",
            TokenType::PasswordAdd => "TOKEN_TYPE_PASSWORD_ADD",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "TOKEN_TYPE_UNSPECIFIED" => Some(Self::Unspecified),
            "TOKEN_TYPE_EMAIL_VERIFICATION" => Some(Self::EmailVerification),
            "TOKEN_TYPE_PASSWORD_RESET" => Some(Self::PasswordReset),
            "TOKEN_TYPE_PASSWORD_ADD" => Some(Self::PasswordAdd),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
