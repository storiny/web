// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Draft {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub title: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub splash_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub splash_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, tag="5")]
    pub word_count: u32,
    #[prost(string, tag="6")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(string, optional, tag="7")]
    pub edited_at: ::core::option::Option<::prost::alloc::string::String>,
}
// Story validation request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValidateStoryRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub story_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValidateStoryResponse {
}
// Create draft request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateDraftRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateDraftResponse {
    #[prost(string, tag="1")]
    pub draft_id: ::prost::alloc::string::String,
}
// Drafts information request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetDraftsInfoRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetDraftsInfoResponse {
    #[prost(uint32, tag="1")]
    pub pending_draft_count: u32,
    #[prost(uint32, tag="2")]
    pub deleted_draft_count: u32,
    #[prost(message, optional, tag="3")]
    pub latest_draft: ::core::option::Option<Draft>,
}
// Stories information request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoriesInfoRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoriesInfoResponse {
    #[prost(uint32, tag="1")]
    pub published_story_count: u32,
    #[prost(uint32, tag="2")]
    pub deleted_story_count: u32,
}
// Contributions information request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetContributionsInfoRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetContributionsInfoResponse {
    #[prost(uint32, tag="1")]
    pub contributable_story_count: u32,
    #[prost(uint32, tag="2")]
    pub pending_collaboration_request_count: u32,
}
// Main story request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoryRequest {
    #[prost(string, tag="1")]
    pub id_or_slug: ::prost::alloc::string::String,
    #[prost(string, optional, tag="2")]
    pub current_user_id: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoryResponse {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub title: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub slug: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub description: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="5")]
    pub splash_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub splash_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="7")]
    pub doc_key: ::prost::alloc::string::String,
    #[prost(string, tag="8")]
    pub category: ::prost::alloc::string::String,
    #[prost(string, tag="9")]
    pub user_id: ::prost::alloc::string::String,
    /// Replace `uint32` with `uint64` when the read count overflows.
    #[prost(uint32, tag="10")]
    pub like_count: u32,
    #[prost(uint32, tag="11")]
    pub read_count: u32,
    #[prost(uint32, tag="12")]
    pub word_count: u32,
    #[prost(uint32, tag="13")]
    pub comment_count: u32,
    #[prost(enumeration="StoryAgeRestriction", tag="14")]
    pub age_restriction: i32,
    #[prost(enumeration="StoryLicense", tag="15")]
    pub license: i32,
    #[prost(enumeration="StoryVisibility", tag="16")]
    pub visibility: i32,
    #[prost(bool, tag="17")]
    pub disable_comments: bool,
    #[prost(bool, tag="18")]
    pub disable_public_revision_history: bool,
    #[prost(bool, tag="19")]
    pub disable_toc: bool,
    /// SEO
    #[prost(string, optional, tag="20")]
    pub canonical_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="21")]
    pub seo_description: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="22")]
    pub seo_title: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="23")]
    pub preview_image: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="24")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(string, optional, tag="25")]
    pub edited_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="26")]
    pub published_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="27")]
    pub first_published_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="28")]
    pub deleted_at: ::core::option::Option<::prost::alloc::string::String>,
    /// Joins
    #[prost(message, optional, tag="29")]
    pub user: ::core::option::Option<super::super::user_def::v1::ExtendedUser>,
    #[prost(message, repeated, tag="30")]
    pub contributors: ::prost::alloc::vec::Vec<super::super::user_def::v1::BareUser>,
    #[prost(message, repeated, tag="31")]
    pub tags: ::prost::alloc::vec::Vec<super::super::tag_def::v1::Tag>,
    #[prost(message, optional, tag="32")]
    pub blog: ::core::option::Option<super::super::blog_def::v1::BareBlog>,
    /// User specific props
    #[prost(bool, tag="33")]
    pub is_bookmarked: bool,
    #[prost(bool, tag="34")]
    pub is_liked: bool,
    /// Reading session token
    #[prost(string, tag="35")]
    pub reading_session_token: ::prost::alloc::string::String,
}
// Story metadata request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoryMetadataRequest {
    #[prost(string, tag="1")]
    pub id_or_slug: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoryMetadataResponse {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub title: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub slug: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub description: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="5")]
    pub splash_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub splash_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="7")]
    pub doc_key: ::prost::alloc::string::String,
    #[prost(string, tag="8")]
    pub category: ::prost::alloc::string::String,
    #[prost(string, tag="9")]
    pub user_id: ::prost::alloc::string::String,
    #[prost(string, tag="10")]
    pub role: ::prost::alloc::string::String,
    #[prost(enumeration="StoryAgeRestriction", tag="11")]
    pub age_restriction: i32,
    #[prost(enumeration="StoryLicense", tag="12")]
    pub license: i32,
    #[prost(enumeration="StoryVisibility", tag="13")]
    pub visibility: i32,
    #[prost(bool, tag="14")]
    pub disable_comments: bool,
    #[prost(bool, tag="15")]
    pub disable_public_revision_history: bool,
    #[prost(bool, tag="16")]
    pub disable_toc: bool,
    /// SEO
    #[prost(string, optional, tag="17")]
    pub canonical_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="18")]
    pub seo_description: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="19")]
    pub seo_title: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="20")]
    pub preview_image: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="21")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(string, optional, tag="22")]
    pub edited_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="23")]
    pub published_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="24")]
    pub first_published_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="25")]
    pub deleted_at: ::core::option::Option<::prost::alloc::string::String>,
    /// Joins
    #[prost(message, optional, tag="26")]
    pub user: ::core::option::Option<super::super::user_def::v1::BareUser>,
    #[prost(message, optional, tag="27")]
    pub blog: ::core::option::Option<super::super::blog_def::v1::BareBlog>,
    #[prost(message, repeated, tag="28")]
    pub tags: ::prost::alloc::vec::Vec<super::super::tag_def::v1::Tag>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum StoryAgeRestriction {
    Unspecified = 0,
    NotRated = 1,
    Rated = 2,
}
impl StoryAgeRestriction {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            StoryAgeRestriction::Unspecified => "STORY_AGE_RESTRICTION_UNSPECIFIED",
            StoryAgeRestriction::NotRated => "STORY_AGE_RESTRICTION_NOT_RATED",
            StoryAgeRestriction::Rated => "STORY_AGE_RESTRICTION_RATED",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "STORY_AGE_RESTRICTION_UNSPECIFIED" => Some(Self::Unspecified),
            "STORY_AGE_RESTRICTION_NOT_RATED" => Some(Self::NotRated),
            "STORY_AGE_RESTRICTION_RATED" => Some(Self::Rated),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum StoryVisibility {
    Unspecified = 0,
    Unlisted = 1,
    Public = 2,
}
impl StoryVisibility {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            StoryVisibility::Unspecified => "STORY_VISIBILITY_UNSPECIFIED",
            StoryVisibility::Unlisted => "STORY_VISIBILITY_UNLISTED",
            StoryVisibility::Public => "STORY_VISIBILITY_PUBLIC",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "STORY_VISIBILITY_UNSPECIFIED" => Some(Self::Unspecified),
            "STORY_VISIBILITY_UNLISTED" => Some(Self::Unlisted),
            "STORY_VISIBILITY_PUBLIC" => Some(Self::Public),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum StoryLicense {
    Unspecified = 0,
    Reserved = 1,
    CcZero = 2,
    CcBy = 3,
    CcBySa = 4,
    CcByNd = 5,
    CcByNc = 6,
    CcByNcSa = 7,
    CcByNcNd = 8,
}
impl StoryLicense {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            StoryLicense::Unspecified => "STORY_LICENSE_UNSPECIFIED",
            StoryLicense::Reserved => "STORY_LICENSE_RESERVED",
            StoryLicense::CcZero => "STORY_LICENSE_CC_ZERO",
            StoryLicense::CcBy => "STORY_LICENSE_CC_BY",
            StoryLicense::CcBySa => "STORY_LICENSE_CC_BY_SA",
            StoryLicense::CcByNd => "STORY_LICENSE_CC_BY_ND",
            StoryLicense::CcByNc => "STORY_LICENSE_CC_BY_NC",
            StoryLicense::CcByNcSa => "STORY_LICENSE_CC_BY_NC_SA",
            StoryLicense::CcByNcNd => "STORY_LICENSE_CC_BY_NC_ND",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "STORY_LICENSE_UNSPECIFIED" => Some(Self::Unspecified),
            "STORY_LICENSE_RESERVED" => Some(Self::Reserved),
            "STORY_LICENSE_CC_ZERO" => Some(Self::CcZero),
            "STORY_LICENSE_CC_BY" => Some(Self::CcBy),
            "STORY_LICENSE_CC_BY_SA" => Some(Self::CcBySa),
            "STORY_LICENSE_CC_BY_ND" => Some(Self::CcByNd),
            "STORY_LICENSE_CC_BY_NC" => Some(Self::CcByNc),
            "STORY_LICENSE_CC_BY_NC_SA" => Some(Self::CcByNcSa),
            "STORY_LICENSE_CC_BY_NC_ND" => Some(Self::CcByNcNd),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
