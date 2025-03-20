// @generated
impl serde::Serialize for GetProfileRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.username.is_empty() {
            len += 1;
        }
        if self.current_user_id.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("profile_def.v1.GetProfileRequest", len)?;
        if !self.username.is_empty() {
            struct_ser.serialize_field("username", &self.username)?;
        }
        if let Some(v) = self.current_user_id.as_ref() {
            struct_ser.serialize_field("currentUserId", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetProfileRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "username",
            "current_user_id",
            "currentUserId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Username,
            CurrentUserId,
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
                            "username" => Ok(GeneratedField::Username),
                            "currentUserId" | "current_user_id" => Ok(GeneratedField::CurrentUserId),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetProfileRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct profile_def.v1.GetProfileRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetProfileRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut username__ = None;
                let mut current_user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Username => {
                            if username__.is_some() {
                                return Err(serde::de::Error::duplicate_field("username"));
                            }
                            username__ = Some(map.next_value()?);
                        }
                        GeneratedField::CurrentUserId => {
                            if current_user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("currentUserId"));
                            }
                            current_user_id__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetProfileRequest {
                    username: username__.unwrap_or_default(),
                    current_user_id: current_user_id__,
                })
            }
        }
        deserializer.deserialize_struct("profile_def.v1.GetProfileRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetProfileResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.id.is_empty() {
            len += 1;
        }
        if !self.name.is_empty() {
            len += 1;
        }
        if !self.username.is_empty() {
            len += 1;
        }
        if self.status.is_some() {
            len += 1;
        }
        if self.bio.is_some() {
            len += 1;
        }
        if self.rendered_bio.is_some() {
            len += 1;
        }
        if self.avatar_id.is_some() {
            len += 1;
        }
        if self.avatar_hex.is_some() {
            len += 1;
        }
        if self.banner_id.is_some() {
            len += 1;
        }
        if self.banner_hex.is_some() {
            len += 1;
        }
        if !self.location.is_empty() {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if self.public_flags != 0 {
            len += 1;
        }
        if self.story_count != 0 {
            len += 1;
        }
        if self.follower_count != 0 {
            len += 1;
        }
        if self.following_count.is_some() {
            len += 1;
        }
        if self.friend_count.is_some() {
            len += 1;
        }
        if self.is_private {
            len += 1;
        }
        if !self.connections.is_empty() {
            len += 1;
        }
        if self.is_following {
            len += 1;
        }
        if self.is_follower {
            len += 1;
        }
        if self.is_friend {
            len += 1;
        }
        if self.is_subscribed {
            len += 1;
        }
        if self.is_friend_request_sent {
            len += 1;
        }
        if self.is_blocked_by_user {
            len += 1;
        }
        if self.is_blocked {
            len += 1;
        }
        if self.is_muted {
            len += 1;
        }
        if self.is_self {
            len += 1;
        }
        if self.is_plus_member {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("profile_def.v1.GetProfileResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if !self.username.is_empty() {
            struct_ser.serialize_field("username", &self.username)?;
        }
        if let Some(v) = self.status.as_ref() {
            struct_ser.serialize_field("status", v)?;
        }
        if let Some(v) = self.bio.as_ref() {
            struct_ser.serialize_field("bio", v)?;
        }
        if let Some(v) = self.rendered_bio.as_ref() {
            struct_ser.serialize_field("renderedBio", v)?;
        }
        if let Some(v) = self.avatar_id.as_ref() {
            struct_ser.serialize_field("avatarId", v)?;
        }
        if let Some(v) = self.avatar_hex.as_ref() {
            struct_ser.serialize_field("avatarHex", v)?;
        }
        if let Some(v) = self.banner_id.as_ref() {
            struct_ser.serialize_field("bannerId", v)?;
        }
        if let Some(v) = self.banner_hex.as_ref() {
            struct_ser.serialize_field("bannerHex", v)?;
        }
        if !self.location.is_empty() {
            struct_ser.serialize_field("location", &self.location)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if self.public_flags != 0 {
            struct_ser.serialize_field("publicFlags", &self.public_flags)?;
        }
        if self.story_count != 0 {
            struct_ser.serialize_field("storyCount", &self.story_count)?;
        }
        if self.follower_count != 0 {
            struct_ser.serialize_field("followerCount", &self.follower_count)?;
        }
        if let Some(v) = self.following_count.as_ref() {
            struct_ser.serialize_field("followingCount", v)?;
        }
        if let Some(v) = self.friend_count.as_ref() {
            struct_ser.serialize_field("friendCount", v)?;
        }
        if self.is_private {
            struct_ser.serialize_field("isPrivate", &self.is_private)?;
        }
        if !self.connections.is_empty() {
            struct_ser.serialize_field("connections", &self.connections)?;
        }
        if self.is_following {
            struct_ser.serialize_field("isFollowing", &self.is_following)?;
        }
        if self.is_follower {
            struct_ser.serialize_field("isFollower", &self.is_follower)?;
        }
        if self.is_friend {
            struct_ser.serialize_field("isFriend", &self.is_friend)?;
        }
        if self.is_subscribed {
            struct_ser.serialize_field("isSubscribed", &self.is_subscribed)?;
        }
        if self.is_friend_request_sent {
            struct_ser.serialize_field("isFriendRequestSent", &self.is_friend_request_sent)?;
        }
        if self.is_blocked_by_user {
            struct_ser.serialize_field("isBlockedByUser", &self.is_blocked_by_user)?;
        }
        if self.is_blocked {
            struct_ser.serialize_field("isBlocked", &self.is_blocked)?;
        }
        if self.is_muted {
            struct_ser.serialize_field("isMuted", &self.is_muted)?;
        }
        if self.is_self {
            struct_ser.serialize_field("isSelf", &self.is_self)?;
        }
        if self.is_plus_member {
            struct_ser.serialize_field("isPlusMember", &self.is_plus_member)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetProfileResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
            "username",
            "status",
            "bio",
            "rendered_bio",
            "renderedBio",
            "avatar_id",
            "avatarId",
            "avatar_hex",
            "avatarHex",
            "banner_id",
            "bannerId",
            "banner_hex",
            "bannerHex",
            "location",
            "created_at",
            "createdAt",
            "public_flags",
            "publicFlags",
            "story_count",
            "storyCount",
            "follower_count",
            "followerCount",
            "following_count",
            "followingCount",
            "friend_count",
            "friendCount",
            "is_private",
            "isPrivate",
            "connections",
            "is_following",
            "isFollowing",
            "is_follower",
            "isFollower",
            "is_friend",
            "isFriend",
            "is_subscribed",
            "isSubscribed",
            "is_friend_request_sent",
            "isFriendRequestSent",
            "is_blocked_by_user",
            "isBlockedByUser",
            "is_blocked",
            "isBlocked",
            "is_muted",
            "isMuted",
            "is_self",
            "isSelf",
            "is_plus_member",
            "isPlusMember",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
            Username,
            Status,
            Bio,
            RenderedBio,
            AvatarId,
            AvatarHex,
            BannerId,
            BannerHex,
            Location,
            CreatedAt,
            PublicFlags,
            StoryCount,
            FollowerCount,
            FollowingCount,
            FriendCount,
            IsPrivate,
            Connections,
            IsFollowing,
            IsFollower,
            IsFriend,
            IsSubscribed,
            IsFriendRequestSent,
            IsBlockedByUser,
            IsBlocked,
            IsMuted,
            IsSelf,
            IsPlusMember,
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
                            "id" => Ok(GeneratedField::Id),
                            "name" => Ok(GeneratedField::Name),
                            "username" => Ok(GeneratedField::Username),
                            "status" => Ok(GeneratedField::Status),
                            "bio" => Ok(GeneratedField::Bio),
                            "renderedBio" | "rendered_bio" => Ok(GeneratedField::RenderedBio),
                            "avatarId" | "avatar_id" => Ok(GeneratedField::AvatarId),
                            "avatarHex" | "avatar_hex" => Ok(GeneratedField::AvatarHex),
                            "bannerId" | "banner_id" => Ok(GeneratedField::BannerId),
                            "bannerHex" | "banner_hex" => Ok(GeneratedField::BannerHex),
                            "location" => Ok(GeneratedField::Location),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "publicFlags" | "public_flags" => Ok(GeneratedField::PublicFlags),
                            "storyCount" | "story_count" => Ok(GeneratedField::StoryCount),
                            "followerCount" | "follower_count" => Ok(GeneratedField::FollowerCount),
                            "followingCount" | "following_count" => Ok(GeneratedField::FollowingCount),
                            "friendCount" | "friend_count" => Ok(GeneratedField::FriendCount),
                            "isPrivate" | "is_private" => Ok(GeneratedField::IsPrivate),
                            "connections" => Ok(GeneratedField::Connections),
                            "isFollowing" | "is_following" => Ok(GeneratedField::IsFollowing),
                            "isFollower" | "is_follower" => Ok(GeneratedField::IsFollower),
                            "isFriend" | "is_friend" => Ok(GeneratedField::IsFriend),
                            "isSubscribed" | "is_subscribed" => Ok(GeneratedField::IsSubscribed),
                            "isFriendRequestSent" | "is_friend_request_sent" => Ok(GeneratedField::IsFriendRequestSent),
                            "isBlockedByUser" | "is_blocked_by_user" => Ok(GeneratedField::IsBlockedByUser),
                            "isBlocked" | "is_blocked" => Ok(GeneratedField::IsBlocked),
                            "isMuted" | "is_muted" => Ok(GeneratedField::IsMuted),
                            "isSelf" | "is_self" => Ok(GeneratedField::IsSelf),
                            "isPlusMember" | "is_plus_member" => Ok(GeneratedField::IsPlusMember),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetProfileResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct profile_def.v1.GetProfileResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetProfileResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
                let mut username__ = None;
                let mut status__ = None;
                let mut bio__ = None;
                let mut rendered_bio__ = None;
                let mut avatar_id__ = None;
                let mut avatar_hex__ = None;
                let mut banner_id__ = None;
                let mut banner_hex__ = None;
                let mut location__ = None;
                let mut created_at__ = None;
                let mut public_flags__ = None;
                let mut story_count__ = None;
                let mut follower_count__ = None;
                let mut following_count__ = None;
                let mut friend_count__ = None;
                let mut is_private__ = None;
                let mut connections__ = None;
                let mut is_following__ = None;
                let mut is_follower__ = None;
                let mut is_friend__ = None;
                let mut is_subscribed__ = None;
                let mut is_friend_request_sent__ = None;
                let mut is_blocked_by_user__ = None;
                let mut is_blocked__ = None;
                let mut is_muted__ = None;
                let mut is_self__ = None;
                let mut is_plus_member__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Name => {
                            if name__.is_some() {
                                return Err(serde::de::Error::duplicate_field("name"));
                            }
                            name__ = Some(map.next_value()?);
                        }
                        GeneratedField::Username => {
                            if username__.is_some() {
                                return Err(serde::de::Error::duplicate_field("username"));
                            }
                            username__ = Some(map.next_value()?);
                        }
                        GeneratedField::Status => {
                            if status__.is_some() {
                                return Err(serde::de::Error::duplicate_field("status"));
                            }
                            status__ = map.next_value()?;
                        }
                        GeneratedField::Bio => {
                            if bio__.is_some() {
                                return Err(serde::de::Error::duplicate_field("bio"));
                            }
                            bio__ = map.next_value()?;
                        }
                        GeneratedField::RenderedBio => {
                            if rendered_bio__.is_some() {
                                return Err(serde::de::Error::duplicate_field("renderedBio"));
                            }
                            rendered_bio__ = map.next_value()?;
                        }
                        GeneratedField::AvatarId => {
                            if avatar_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("avatarId"));
                            }
                            avatar_id__ = map.next_value()?;
                        }
                        GeneratedField::AvatarHex => {
                            if avatar_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("avatarHex"));
                            }
                            avatar_hex__ = map.next_value()?;
                        }
                        GeneratedField::BannerId => {
                            if banner_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("bannerId"));
                            }
                            banner_id__ = map.next_value()?;
                        }
                        GeneratedField::BannerHex => {
                            if banner_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("bannerHex"));
                            }
                            banner_hex__ = map.next_value()?;
                        }
                        GeneratedField::Location => {
                            if location__.is_some() {
                                return Err(serde::de::Error::duplicate_field("location"));
                            }
                            location__ = Some(map.next_value()?);
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                        GeneratedField::PublicFlags => {
                            if public_flags__.is_some() {
                                return Err(serde::de::Error::duplicate_field("publicFlags"));
                            }
                            public_flags__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::StoryCount => {
                            if story_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("storyCount"));
                            }
                            story_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::FollowerCount => {
                            if follower_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("followerCount"));
                            }
                            follower_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::FollowingCount => {
                            if following_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("followingCount"));
                            }
                            following_count__ = 
                                map.next_value::<::std::option::Option<::pbjson::private::NumberDeserialize<_>>>()?.map(|x| x.0)
                            ;
                        }
                        GeneratedField::FriendCount => {
                            if friend_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("friendCount"));
                            }
                            friend_count__ = 
                                map.next_value::<::std::option::Option<::pbjson::private::NumberDeserialize<_>>>()?.map(|x| x.0)
                            ;
                        }
                        GeneratedField::IsPrivate => {
                            if is_private__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isPrivate"));
                            }
                            is_private__ = Some(map.next_value()?);
                        }
                        GeneratedField::Connections => {
                            if connections__.is_some() {
                                return Err(serde::de::Error::duplicate_field("connections"));
                            }
                            connections__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsFollowing => {
                            if is_following__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isFollowing"));
                            }
                            is_following__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsFollower => {
                            if is_follower__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isFollower"));
                            }
                            is_follower__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsFriend => {
                            if is_friend__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isFriend"));
                            }
                            is_friend__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsSubscribed => {
                            if is_subscribed__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isSubscribed"));
                            }
                            is_subscribed__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsFriendRequestSent => {
                            if is_friend_request_sent__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isFriendRequestSent"));
                            }
                            is_friend_request_sent__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsBlockedByUser => {
                            if is_blocked_by_user__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isBlockedByUser"));
                            }
                            is_blocked_by_user__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsBlocked => {
                            if is_blocked__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isBlocked"));
                            }
                            is_blocked__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsMuted => {
                            if is_muted__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isMuted"));
                            }
                            is_muted__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsSelf => {
                            if is_self__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isSelf"));
                            }
                            is_self__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsPlusMember => {
                            if is_plus_member__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isPlusMember"));
                            }
                            is_plus_member__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetProfileResponse {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                    username: username__.unwrap_or_default(),
                    status: status__,
                    bio: bio__,
                    rendered_bio: rendered_bio__,
                    avatar_id: avatar_id__,
                    avatar_hex: avatar_hex__,
                    banner_id: banner_id__,
                    banner_hex: banner_hex__,
                    location: location__.unwrap_or_default(),
                    created_at: created_at__.unwrap_or_default(),
                    public_flags: public_flags__.unwrap_or_default(),
                    story_count: story_count__.unwrap_or_default(),
                    follower_count: follower_count__.unwrap_or_default(),
                    following_count: following_count__,
                    friend_count: friend_count__,
                    is_private: is_private__.unwrap_or_default(),
                    connections: connections__.unwrap_or_default(),
                    is_following: is_following__.unwrap_or_default(),
                    is_follower: is_follower__.unwrap_or_default(),
                    is_friend: is_friend__.unwrap_or_default(),
                    is_subscribed: is_subscribed__.unwrap_or_default(),
                    is_friend_request_sent: is_friend_request_sent__.unwrap_or_default(),
                    is_blocked_by_user: is_blocked_by_user__.unwrap_or_default(),
                    is_blocked: is_blocked__.unwrap_or_default(),
                    is_muted: is_muted__.unwrap_or_default(),
                    is_self: is_self__.unwrap_or_default(),
                    is_plus_member: is_plus_member__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("profile_def.v1.GetProfileResponse", FIELDS, GeneratedVisitor)
    }
}
