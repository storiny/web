// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetPrivacySettingsRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetPrivacySettingsResponse {
    #[prost(bool, tag="1")]
    pub is_private_account: bool,
    #[prost(bool, tag="2")]
    pub record_read_history: bool,
    #[prost(bool, tag="3")]
    pub allow_sensitive_media: bool,
    #[prost(enumeration="IncomingFriendRequest", tag="4")]
    pub incoming_friend_requests: i32,
    #[prost(enumeration="IncomingCollaborationRequest", tag="5")]
    pub incoming_collaboration_requests: i32,
    #[prost(enumeration="IncomingBlogRequest", tag="6")]
    pub incoming_blog_requests: i32,
    #[prost(enumeration="RelationVisibility", tag="7")]
    pub following_list_visibility: i32,
    #[prost(enumeration="RelationVisibility", tag="8")]
    pub friend_list_visibility: i32,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IncomingFriendRequest {
    Unspecified = 0,
    Everyone = 1,
    Following = 2,
    Fof = 3,
    None = 4,
}
impl IncomingFriendRequest {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            IncomingFriendRequest::Unspecified => "INCOMING_FRIEND_REQUEST_UNSPECIFIED",
            IncomingFriendRequest::Everyone => "INCOMING_FRIEND_REQUEST_EVERYONE",
            IncomingFriendRequest::Following => "INCOMING_FRIEND_REQUEST_FOLLOWING",
            IncomingFriendRequest::Fof => "INCOMING_FRIEND_REQUEST_FOF",
            IncomingFriendRequest::None => "INCOMING_FRIEND_REQUEST_NONE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "INCOMING_FRIEND_REQUEST_UNSPECIFIED" => Some(Self::Unspecified),
            "INCOMING_FRIEND_REQUEST_EVERYONE" => Some(Self::Everyone),
            "INCOMING_FRIEND_REQUEST_FOLLOWING" => Some(Self::Following),
            "INCOMING_FRIEND_REQUEST_FOF" => Some(Self::Fof),
            "INCOMING_FRIEND_REQUEST_NONE" => Some(Self::None),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IncomingCollaborationRequest {
    Unspecified = 0,
    Everyone = 1,
    Following = 2,
    Friends = 3,
    None = 4,
}
impl IncomingCollaborationRequest {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            IncomingCollaborationRequest::Unspecified => "INCOMING_COLLABORATION_REQUEST_UNSPECIFIED",
            IncomingCollaborationRequest::Everyone => "INCOMING_COLLABORATION_REQUEST_EVERYONE",
            IncomingCollaborationRequest::Following => "INCOMING_COLLABORATION_REQUEST_FOLLOWING",
            IncomingCollaborationRequest::Friends => "INCOMING_COLLABORATION_REQUEST_FRIENDS",
            IncomingCollaborationRequest::None => "INCOMING_COLLABORATION_REQUEST_NONE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "INCOMING_COLLABORATION_REQUEST_UNSPECIFIED" => Some(Self::Unspecified),
            "INCOMING_COLLABORATION_REQUEST_EVERYONE" => Some(Self::Everyone),
            "INCOMING_COLLABORATION_REQUEST_FOLLOWING" => Some(Self::Following),
            "INCOMING_COLLABORATION_REQUEST_FRIENDS" => Some(Self::Friends),
            "INCOMING_COLLABORATION_REQUEST_NONE" => Some(Self::None),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IncomingBlogRequest {
    Unspecified = 0,
    Everyone = 1,
    Following = 2,
    Friends = 3,
    None = 4,
}
impl IncomingBlogRequest {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            IncomingBlogRequest::Unspecified => "INCOMING_BLOG_REQUEST_UNSPECIFIED",
            IncomingBlogRequest::Everyone => "INCOMING_BLOG_REQUEST_EVERYONE",
            IncomingBlogRequest::Following => "INCOMING_BLOG_REQUEST_FOLLOWING",
            IncomingBlogRequest::Friends => "INCOMING_BLOG_REQUEST_FRIENDS",
            IncomingBlogRequest::None => "INCOMING_BLOG_REQUEST_NONE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "INCOMING_BLOG_REQUEST_UNSPECIFIED" => Some(Self::Unspecified),
            "INCOMING_BLOG_REQUEST_EVERYONE" => Some(Self::Everyone),
            "INCOMING_BLOG_REQUEST_FOLLOWING" => Some(Self::Following),
            "INCOMING_BLOG_REQUEST_FRIENDS" => Some(Self::Friends),
            "INCOMING_BLOG_REQUEST_NONE" => Some(Self::None),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum RelationVisibility {
    Unspecified = 0,
    Everyone = 1,
    Friends = 2,
    None = 3,
}
impl RelationVisibility {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            RelationVisibility::Unspecified => "RELATION_VISIBILITY_UNSPECIFIED",
            RelationVisibility::Everyone => "RELATION_VISIBILITY_EVERYONE",
            RelationVisibility::Friends => "RELATION_VISIBILITY_FRIENDS",
            RelationVisibility::None => "RELATION_VISIBILITY_NONE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "RELATION_VISIBILITY_UNSPECIFIED" => Some(Self::Unspecified),
            "RELATION_VISIBILITY_EVERYONE" => Some(Self::Everyone),
            "RELATION_VISIBILITY_FRIENDS" => Some(Self::Friends),
            "RELATION_VISIBILITY_NONE" => Some(Self::None),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
