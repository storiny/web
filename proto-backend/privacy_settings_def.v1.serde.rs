// @generated
impl serde::Serialize for GetPrivacySettingsRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.user_id.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("privacy_settings_def.v1.GetPrivacySettingsRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetPrivacySettingsRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "user_id",
            "userId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            UserId,
        }
        impl<'de> serde::Deserialize<'de> for GeneratedField {
            fn deserialize<D>(deserializer: D) -> std::result::Result<GeneratedField, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                struct GeneratedVisitor;

                impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
                    type Value = GeneratedField;

                    fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                        write!(formatter, "expected one of: {:?}", &FIELDS)
                    }

                    #[allow(unused_variables)]
                    fn visit_str<E>(self, value: &str) -> std::result::Result<GeneratedField, E>
                    where
                        E: serde::de::Error,
                    {
                        match value {
                            "userId" | "user_id" => Ok(GeneratedField::UserId),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetPrivacySettingsRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct privacy_settings_def.v1.GetPrivacySettingsRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetPrivacySettingsRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::UserId => {
                            if user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("userId"));
                            }
                            user_id__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetPrivacySettingsRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("privacy_settings_def.v1.GetPrivacySettingsRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetPrivacySettingsResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.is_private_account {
            len += 1;
        }
        if self.record_read_history {
            len += 1;
        }
        if self.allow_sensitive_media {
            len += 1;
        }
        if self.incoming_friend_requests != 0 {
            len += 1;
        }
        if self.incoming_collaboration_requests != 0 {
            len += 1;
        }
        if self.incoming_blog_requests != 0 {
            len += 1;
        }
        if self.following_list_visibility != 0 {
            len += 1;
        }
        if self.friend_list_visibility != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("privacy_settings_def.v1.GetPrivacySettingsResponse", len)?;
        if self.is_private_account {
            struct_ser.serialize_field("isPrivateAccount", &self.is_private_account)?;
        }
        if self.record_read_history {
            struct_ser.serialize_field("recordReadHistory", &self.record_read_history)?;
        }
        if self.allow_sensitive_media {
            struct_ser.serialize_field("allowSensitiveMedia", &self.allow_sensitive_media)?;
        }
        if self.incoming_friend_requests != 0 {
            let v = IncomingFriendRequest::from_i32(self.incoming_friend_requests)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.incoming_friend_requests)))?;
            struct_ser.serialize_field("incomingFriendRequests", &v)?;
        }
        if self.incoming_collaboration_requests != 0 {
            let v = IncomingCollaborationRequest::from_i32(self.incoming_collaboration_requests)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.incoming_collaboration_requests)))?;
            struct_ser.serialize_field("incomingCollaborationRequests", &v)?;
        }
        if self.incoming_blog_requests != 0 {
            let v = IncomingBlogRequest::from_i32(self.incoming_blog_requests)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.incoming_blog_requests)))?;
            struct_ser.serialize_field("incomingBlogRequests", &v)?;
        }
        if self.following_list_visibility != 0 {
            let v = RelationVisibility::from_i32(self.following_list_visibility)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.following_list_visibility)))?;
            struct_ser.serialize_field("followingListVisibility", &v)?;
        }
        if self.friend_list_visibility != 0 {
            let v = RelationVisibility::from_i32(self.friend_list_visibility)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.friend_list_visibility)))?;
            struct_ser.serialize_field("friendListVisibility", &v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetPrivacySettingsResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "is_private_account",
            "isPrivateAccount",
            "record_read_history",
            "recordReadHistory",
            "allow_sensitive_media",
            "allowSensitiveMedia",
            "incoming_friend_requests",
            "incomingFriendRequests",
            "incoming_collaboration_requests",
            "incomingCollaborationRequests",
            "incoming_blog_requests",
            "incomingBlogRequests",
            "following_list_visibility",
            "followingListVisibility",
            "friend_list_visibility",
            "friendListVisibility",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            IsPrivateAccount,
            RecordReadHistory,
            AllowSensitiveMedia,
            IncomingFriendRequests,
            IncomingCollaborationRequests,
            IncomingBlogRequests,
            FollowingListVisibility,
            FriendListVisibility,
        }
        impl<'de> serde::Deserialize<'de> for GeneratedField {
            fn deserialize<D>(deserializer: D) -> std::result::Result<GeneratedField, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                struct GeneratedVisitor;

                impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
                    type Value = GeneratedField;

                    fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                        write!(formatter, "expected one of: {:?}", &FIELDS)
                    }

                    #[allow(unused_variables)]
                    fn visit_str<E>(self, value: &str) -> std::result::Result<GeneratedField, E>
                    where
                        E: serde::de::Error,
                    {
                        match value {
                            "isPrivateAccount" | "is_private_account" => Ok(GeneratedField::IsPrivateAccount),
                            "recordReadHistory" | "record_read_history" => Ok(GeneratedField::RecordReadHistory),
                            "allowSensitiveMedia" | "allow_sensitive_media" => Ok(GeneratedField::AllowSensitiveMedia),
                            "incomingFriendRequests" | "incoming_friend_requests" => Ok(GeneratedField::IncomingFriendRequests),
                            "incomingCollaborationRequests" | "incoming_collaboration_requests" => Ok(GeneratedField::IncomingCollaborationRequests),
                            "incomingBlogRequests" | "incoming_blog_requests" => Ok(GeneratedField::IncomingBlogRequests),
                            "followingListVisibility" | "following_list_visibility" => Ok(GeneratedField::FollowingListVisibility),
                            "friendListVisibility" | "friend_list_visibility" => Ok(GeneratedField::FriendListVisibility),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetPrivacySettingsResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct privacy_settings_def.v1.GetPrivacySettingsResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetPrivacySettingsResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut is_private_account__ = None;
                let mut record_read_history__ = None;
                let mut allow_sensitive_media__ = None;
                let mut incoming_friend_requests__ = None;
                let mut incoming_collaboration_requests__ = None;
                let mut incoming_blog_requests__ = None;
                let mut following_list_visibility__ = None;
                let mut friend_list_visibility__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::IsPrivateAccount => {
                            if is_private_account__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isPrivateAccount"));
                            }
                            is_private_account__ = Some(map.next_value()?);
                        }
                        GeneratedField::RecordReadHistory => {
                            if record_read_history__.is_some() {
                                return Err(serde::de::Error::duplicate_field("recordReadHistory"));
                            }
                            record_read_history__ = Some(map.next_value()?);
                        }
                        GeneratedField::AllowSensitiveMedia => {
                            if allow_sensitive_media__.is_some() {
                                return Err(serde::de::Error::duplicate_field("allowSensitiveMedia"));
                            }
                            allow_sensitive_media__ = Some(map.next_value()?);
                        }
                        GeneratedField::IncomingFriendRequests => {
                            if incoming_friend_requests__.is_some() {
                                return Err(serde::de::Error::duplicate_field("incomingFriendRequests"));
                            }
                            incoming_friend_requests__ = Some(map.next_value::<IncomingFriendRequest>()? as i32);
                        }
                        GeneratedField::IncomingCollaborationRequests => {
                            if incoming_collaboration_requests__.is_some() {
                                return Err(serde::de::Error::duplicate_field("incomingCollaborationRequests"));
                            }
                            incoming_collaboration_requests__ = Some(map.next_value::<IncomingCollaborationRequest>()? as i32);
                        }
                        GeneratedField::IncomingBlogRequests => {
                            if incoming_blog_requests__.is_some() {
                                return Err(serde::de::Error::duplicate_field("incomingBlogRequests"));
                            }
                            incoming_blog_requests__ = Some(map.next_value::<IncomingBlogRequest>()? as i32);
                        }
                        GeneratedField::FollowingListVisibility => {
                            if following_list_visibility__.is_some() {
                                return Err(serde::de::Error::duplicate_field("followingListVisibility"));
                            }
                            following_list_visibility__ = Some(map.next_value::<RelationVisibility>()? as i32);
                        }
                        GeneratedField::FriendListVisibility => {
                            if friend_list_visibility__.is_some() {
                                return Err(serde::de::Error::duplicate_field("friendListVisibility"));
                            }
                            friend_list_visibility__ = Some(map.next_value::<RelationVisibility>()? as i32);
                        }
                    }
                }
                Ok(GetPrivacySettingsResponse {
                    is_private_account: is_private_account__.unwrap_or_default(),
                    record_read_history: record_read_history__.unwrap_or_default(),
                    allow_sensitive_media: allow_sensitive_media__.unwrap_or_default(),
                    incoming_friend_requests: incoming_friend_requests__.unwrap_or_default(),
                    incoming_collaboration_requests: incoming_collaboration_requests__.unwrap_or_default(),
                    incoming_blog_requests: incoming_blog_requests__.unwrap_or_default(),
                    following_list_visibility: following_list_visibility__.unwrap_or_default(),
                    friend_list_visibility: friend_list_visibility__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("privacy_settings_def.v1.GetPrivacySettingsResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for IncomingBlogRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Everyone => 1,
            Self::Following => 2,
            Self::Friends => 3,
            Self::None => 4,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for IncomingBlogRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "INCOMING_BLOG_REQUEST_UNSPECIFIED",
            "INCOMING_BLOG_REQUEST_EVERYONE",
            "INCOMING_BLOG_REQUEST_FOLLOWING",
            "INCOMING_BLOG_REQUEST_FRIENDS",
            "INCOMING_BLOG_REQUEST_NONE",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = IncomingBlogRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(formatter, "expected one of: {:?}", &FIELDS)
            }

            fn visit_i64<E>(self, v: i64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(IncomingBlogRequest::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Signed(v), &self)
                    })
            }

            fn visit_u64<E>(self, v: u64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(IncomingBlogRequest::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "INCOMING_BLOG_REQUEST_UNSPECIFIED" => Ok(IncomingBlogRequest::Unspecified),
                    "INCOMING_BLOG_REQUEST_EVERYONE" => Ok(IncomingBlogRequest::Everyone),
                    "INCOMING_BLOG_REQUEST_FOLLOWING" => Ok(IncomingBlogRequest::Following),
                    "INCOMING_BLOG_REQUEST_FRIENDS" => Ok(IncomingBlogRequest::Friends),
                    "INCOMING_BLOG_REQUEST_NONE" => Ok(IncomingBlogRequest::None),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for IncomingCollaborationRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Everyone => 1,
            Self::Following => 2,
            Self::Friends => 3,
            Self::None => 4,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for IncomingCollaborationRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "INCOMING_COLLABORATION_REQUEST_UNSPECIFIED",
            "INCOMING_COLLABORATION_REQUEST_EVERYONE",
            "INCOMING_COLLABORATION_REQUEST_FOLLOWING",
            "INCOMING_COLLABORATION_REQUEST_FRIENDS",
            "INCOMING_COLLABORATION_REQUEST_NONE",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = IncomingCollaborationRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(formatter, "expected one of: {:?}", &FIELDS)
            }

            fn visit_i64<E>(self, v: i64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(IncomingCollaborationRequest::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Signed(v), &self)
                    })
            }

            fn visit_u64<E>(self, v: u64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(IncomingCollaborationRequest::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "INCOMING_COLLABORATION_REQUEST_UNSPECIFIED" => Ok(IncomingCollaborationRequest::Unspecified),
                    "INCOMING_COLLABORATION_REQUEST_EVERYONE" => Ok(IncomingCollaborationRequest::Everyone),
                    "INCOMING_COLLABORATION_REQUEST_FOLLOWING" => Ok(IncomingCollaborationRequest::Following),
                    "INCOMING_COLLABORATION_REQUEST_FRIENDS" => Ok(IncomingCollaborationRequest::Friends),
                    "INCOMING_COLLABORATION_REQUEST_NONE" => Ok(IncomingCollaborationRequest::None),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for IncomingFriendRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Everyone => 1,
            Self::Following => 2,
            Self::Fof => 3,
            Self::None => 4,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for IncomingFriendRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "INCOMING_FRIEND_REQUEST_UNSPECIFIED",
            "INCOMING_FRIEND_REQUEST_EVERYONE",
            "INCOMING_FRIEND_REQUEST_FOLLOWING",
            "INCOMING_FRIEND_REQUEST_FOF",
            "INCOMING_FRIEND_REQUEST_NONE",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = IncomingFriendRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(formatter, "expected one of: {:?}", &FIELDS)
            }

            fn visit_i64<E>(self, v: i64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(IncomingFriendRequest::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Signed(v), &self)
                    })
            }

            fn visit_u64<E>(self, v: u64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(IncomingFriendRequest::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "INCOMING_FRIEND_REQUEST_UNSPECIFIED" => Ok(IncomingFriendRequest::Unspecified),
                    "INCOMING_FRIEND_REQUEST_EVERYONE" => Ok(IncomingFriendRequest::Everyone),
                    "INCOMING_FRIEND_REQUEST_FOLLOWING" => Ok(IncomingFriendRequest::Following),
                    "INCOMING_FRIEND_REQUEST_FOF" => Ok(IncomingFriendRequest::Fof),
                    "INCOMING_FRIEND_REQUEST_NONE" => Ok(IncomingFriendRequest::None),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for RelationVisibility {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Everyone => 1,
            Self::Friends => 2,
            Self::None => 3,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for RelationVisibility {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "RELATION_VISIBILITY_UNSPECIFIED",
            "RELATION_VISIBILITY_EVERYONE",
            "RELATION_VISIBILITY_FRIENDS",
            "RELATION_VISIBILITY_NONE",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = RelationVisibility;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(formatter, "expected one of: {:?}", &FIELDS)
            }

            fn visit_i64<E>(self, v: i64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(RelationVisibility::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Signed(v), &self)
                    })
            }

            fn visit_u64<E>(self, v: u64) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                use std::convert::TryFrom;
                i32::try_from(v)
                    .ok()
                    .and_then(RelationVisibility::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "RELATION_VISIBILITY_UNSPECIFIED" => Ok(RelationVisibility::Unspecified),
                    "RELATION_VISIBILITY_EVERYONE" => Ok(RelationVisibility::Everyone),
                    "RELATION_VISIBILITY_FRIENDS" => Ok(RelationVisibility::Friends),
                    "RELATION_VISIBILITY_NONE" => Ok(RelationVisibility::None),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
