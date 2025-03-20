// @generated
impl serde::Serialize for BareStatus {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.emoji.is_some() {
            len += 1;
        }
        if self.text.is_some() {
            len += 1;
        }
        if self.expires_at.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.BareStatus", len)?;
        if let Some(v) = self.emoji.as_ref() {
            struct_ser.serialize_field("emoji", v)?;
        }
        if let Some(v) = self.text.as_ref() {
            struct_ser.serialize_field("text", v)?;
        }
        if let Some(v) = self.expires_at.as_ref() {
            struct_ser.serialize_field("expiresAt", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for BareStatus {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "emoji",
            "text",
            "expires_at",
            "expiresAt",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Emoji,
            Text,
            ExpiresAt,
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
                            "emoji" => Ok(GeneratedField::Emoji),
                            "text" => Ok(GeneratedField::Text),
                            "expiresAt" | "expires_at" => Ok(GeneratedField::ExpiresAt),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = BareStatus;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.BareStatus")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<BareStatus, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut emoji__ = None;
                let mut text__ = None;
                let mut expires_at__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Emoji => {
                            if emoji__.is_some() {
                                return Err(serde::de::Error::duplicate_field("emoji"));
                            }
                            emoji__ = map.next_value()?;
                        }
                        GeneratedField::Text => {
                            if text__.is_some() {
                                return Err(serde::de::Error::duplicate_field("text"));
                            }
                            text__ = map.next_value()?;
                        }
                        GeneratedField::ExpiresAt => {
                            if expires_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("expiresAt"));
                            }
                            expires_at__ = map.next_value()?;
                        }
                    }
                }
                Ok(BareStatus {
                    emoji: emoji__,
                    text: text__,
                    expires_at: expires_at__,
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.BareStatus", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for BareUser {
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
        if self.avatar_id.is_some() {
            len += 1;
        }
        if self.avatar_hex.is_some() {
            len += 1;
        }
        if self.public_flags != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.BareUser", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if !self.username.is_empty() {
            struct_ser.serialize_field("username", &self.username)?;
        }
        if let Some(v) = self.avatar_id.as_ref() {
            struct_ser.serialize_field("avatarId", v)?;
        }
        if let Some(v) = self.avatar_hex.as_ref() {
            struct_ser.serialize_field("avatarHex", v)?;
        }
        if self.public_flags != 0 {
            struct_ser.serialize_field("publicFlags", &self.public_flags)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for BareUser {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
            "username",
            "avatar_id",
            "avatarId",
            "avatar_hex",
            "avatarHex",
            "public_flags",
            "publicFlags",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
            Username,
            AvatarId,
            AvatarHex,
            PublicFlags,
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
                            "avatarId" | "avatar_id" => Ok(GeneratedField::AvatarId),
                            "avatarHex" | "avatar_hex" => Ok(GeneratedField::AvatarHex),
                            "publicFlags" | "public_flags" => Ok(GeneratedField::PublicFlags),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = BareUser;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.BareUser")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<BareUser, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
                let mut username__ = None;
                let mut avatar_id__ = None;
                let mut avatar_hex__ = None;
                let mut public_flags__ = None;
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
                        GeneratedField::PublicFlags => {
                            if public_flags__.is_some() {
                                return Err(serde::de::Error::duplicate_field("publicFlags"));
                            }
                            public_flags__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(BareUser {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                    username: username__.unwrap_or_default(),
                    avatar_id: avatar_id__,
                    avatar_hex: avatar_hex__,
                    public_flags: public_flags__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.BareUser", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for ExtendedStatus {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.emoji.is_some() {
            len += 1;
        }
        if self.text.is_some() {
            len += 1;
        }
        if self.expires_at.is_some() {
            len += 1;
        }
        if self.duration != 0 {
            len += 1;
        }
        if self.visibility != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.ExtendedStatus", len)?;
        if let Some(v) = self.emoji.as_ref() {
            struct_ser.serialize_field("emoji", v)?;
        }
        if let Some(v) = self.text.as_ref() {
            struct_ser.serialize_field("text", v)?;
        }
        if let Some(v) = self.expires_at.as_ref() {
            struct_ser.serialize_field("expiresAt", v)?;
        }
        if self.duration != 0 {
            let v = StatusDuration::from_i32(self.duration)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.duration)))?;
            struct_ser.serialize_field("duration", &v)?;
        }
        if self.visibility != 0 {
            let v = StatusVisibility::from_i32(self.visibility)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.visibility)))?;
            struct_ser.serialize_field("visibility", &v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for ExtendedStatus {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "emoji",
            "text",
            "expires_at",
            "expiresAt",
            "duration",
            "visibility",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Emoji,
            Text,
            ExpiresAt,
            Duration,
            Visibility,
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
                            "emoji" => Ok(GeneratedField::Emoji),
                            "text" => Ok(GeneratedField::Text),
                            "expiresAt" | "expires_at" => Ok(GeneratedField::ExpiresAt),
                            "duration" => Ok(GeneratedField::Duration),
                            "visibility" => Ok(GeneratedField::Visibility),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = ExtendedStatus;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.ExtendedStatus")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<ExtendedStatus, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut emoji__ = None;
                let mut text__ = None;
                let mut expires_at__ = None;
                let mut duration__ = None;
                let mut visibility__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Emoji => {
                            if emoji__.is_some() {
                                return Err(serde::de::Error::duplicate_field("emoji"));
                            }
                            emoji__ = map.next_value()?;
                        }
                        GeneratedField::Text => {
                            if text__.is_some() {
                                return Err(serde::de::Error::duplicate_field("text"));
                            }
                            text__ = map.next_value()?;
                        }
                        GeneratedField::ExpiresAt => {
                            if expires_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("expiresAt"));
                            }
                            expires_at__ = map.next_value()?;
                        }
                        GeneratedField::Duration => {
                            if duration__.is_some() {
                                return Err(serde::de::Error::duplicate_field("duration"));
                            }
                            duration__ = Some(map.next_value::<StatusDuration>()? as i32);
                        }
                        GeneratedField::Visibility => {
                            if visibility__.is_some() {
                                return Err(serde::de::Error::duplicate_field("visibility"));
                            }
                            visibility__ = Some(map.next_value::<StatusVisibility>()? as i32);
                        }
                    }
                }
                Ok(ExtendedStatus {
                    emoji: emoji__,
                    text: text__,
                    expires_at: expires_at__,
                    duration: duration__.unwrap_or_default(),
                    visibility: visibility__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.ExtendedStatus", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for ExtendedUser {
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
        if !self.rendered_bio.is_empty() {
            len += 1;
        }
        if self.avatar_id.is_some() {
            len += 1;
        }
        if self.avatar_hex.is_some() {
            len += 1;
        }
        if self.public_flags != 0 {
            len += 1;
        }
        if self.is_private {
            len += 1;
        }
        if !self.location.is_empty() {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if self.follower_count != 0 {
            len += 1;
        }
        if self.status.is_some() {
            len += 1;
        }
        if self.is_self {
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
        if self.is_blocked_by_user {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.ExtendedUser", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if !self.username.is_empty() {
            struct_ser.serialize_field("username", &self.username)?;
        }
        if !self.rendered_bio.is_empty() {
            struct_ser.serialize_field("renderedBio", &self.rendered_bio)?;
        }
        if let Some(v) = self.avatar_id.as_ref() {
            struct_ser.serialize_field("avatarId", v)?;
        }
        if let Some(v) = self.avatar_hex.as_ref() {
            struct_ser.serialize_field("avatarHex", v)?;
        }
        if self.public_flags != 0 {
            struct_ser.serialize_field("publicFlags", &self.public_flags)?;
        }
        if self.is_private {
            struct_ser.serialize_field("isPrivate", &self.is_private)?;
        }
        if !self.location.is_empty() {
            struct_ser.serialize_field("location", &self.location)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if self.follower_count != 0 {
            struct_ser.serialize_field("followerCount", &self.follower_count)?;
        }
        if let Some(v) = self.status.as_ref() {
            struct_ser.serialize_field("status", v)?;
        }
        if self.is_self {
            struct_ser.serialize_field("isSelf", &self.is_self)?;
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
        if self.is_blocked_by_user {
            struct_ser.serialize_field("isBlockedByUser", &self.is_blocked_by_user)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for ExtendedUser {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
            "username",
            "rendered_bio",
            "renderedBio",
            "avatar_id",
            "avatarId",
            "avatar_hex",
            "avatarHex",
            "public_flags",
            "publicFlags",
            "is_private",
            "isPrivate",
            "location",
            "created_at",
            "createdAt",
            "follower_count",
            "followerCount",
            "status",
            "is_self",
            "isSelf",
            "is_following",
            "isFollowing",
            "is_follower",
            "isFollower",
            "is_friend",
            "isFriend",
            "is_blocked_by_user",
            "isBlockedByUser",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
            Username,
            RenderedBio,
            AvatarId,
            AvatarHex,
            PublicFlags,
            IsPrivate,
            Location,
            CreatedAt,
            FollowerCount,
            Status,
            IsSelf,
            IsFollowing,
            IsFollower,
            IsFriend,
            IsBlockedByUser,
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
                            "renderedBio" | "rendered_bio" => Ok(GeneratedField::RenderedBio),
                            "avatarId" | "avatar_id" => Ok(GeneratedField::AvatarId),
                            "avatarHex" | "avatar_hex" => Ok(GeneratedField::AvatarHex),
                            "publicFlags" | "public_flags" => Ok(GeneratedField::PublicFlags),
                            "isPrivate" | "is_private" => Ok(GeneratedField::IsPrivate),
                            "location" => Ok(GeneratedField::Location),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "followerCount" | "follower_count" => Ok(GeneratedField::FollowerCount),
                            "status" => Ok(GeneratedField::Status),
                            "isSelf" | "is_self" => Ok(GeneratedField::IsSelf),
                            "isFollowing" | "is_following" => Ok(GeneratedField::IsFollowing),
                            "isFollower" | "is_follower" => Ok(GeneratedField::IsFollower),
                            "isFriend" | "is_friend" => Ok(GeneratedField::IsFriend),
                            "isBlockedByUser" | "is_blocked_by_user" => Ok(GeneratedField::IsBlockedByUser),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = ExtendedUser;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.ExtendedUser")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<ExtendedUser, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
                let mut username__ = None;
                let mut rendered_bio__ = None;
                let mut avatar_id__ = None;
                let mut avatar_hex__ = None;
                let mut public_flags__ = None;
                let mut is_private__ = None;
                let mut location__ = None;
                let mut created_at__ = None;
                let mut follower_count__ = None;
                let mut status__ = None;
                let mut is_self__ = None;
                let mut is_following__ = None;
                let mut is_follower__ = None;
                let mut is_friend__ = None;
                let mut is_blocked_by_user__ = None;
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
                        GeneratedField::RenderedBio => {
                            if rendered_bio__.is_some() {
                                return Err(serde::de::Error::duplicate_field("renderedBio"));
                            }
                            rendered_bio__ = Some(map.next_value()?);
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
                        GeneratedField::PublicFlags => {
                            if public_flags__.is_some() {
                                return Err(serde::de::Error::duplicate_field("publicFlags"));
                            }
                            public_flags__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::IsPrivate => {
                            if is_private__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isPrivate"));
                            }
                            is_private__ = Some(map.next_value()?);
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
                        GeneratedField::FollowerCount => {
                            if follower_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("followerCount"));
                            }
                            follower_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::Status => {
                            if status__.is_some() {
                                return Err(serde::de::Error::duplicate_field("status"));
                            }
                            status__ = map.next_value()?;
                        }
                        GeneratedField::IsSelf => {
                            if is_self__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isSelf"));
                            }
                            is_self__ = Some(map.next_value()?);
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
                        GeneratedField::IsBlockedByUser => {
                            if is_blocked_by_user__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isBlockedByUser"));
                            }
                            is_blocked_by_user__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(ExtendedUser {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                    username: username__.unwrap_or_default(),
                    rendered_bio: rendered_bio__.unwrap_or_default(),
                    avatar_id: avatar_id__,
                    avatar_hex: avatar_hex__,
                    public_flags: public_flags__.unwrap_or_default(),
                    is_private: is_private__.unwrap_or_default(),
                    location: location__.unwrap_or_default(),
                    created_at: created_at__.unwrap_or_default(),
                    follower_count: follower_count__.unwrap_or_default(),
                    status: status__,
                    is_self: is_self__.unwrap_or_default(),
                    is_following: is_following__.unwrap_or_default(),
                    is_follower: is_follower__.unwrap_or_default(),
                    is_friend: is_friend__.unwrap_or_default(),
                    is_blocked_by_user: is_blocked_by_user__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.ExtendedUser", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserBlockCountRequest {
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
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserBlockCountRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserBlockCountRequest {
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
            type Value = GetUserBlockCountRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserBlockCountRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserBlockCountRequest, V::Error>
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
                Ok(GetUserBlockCountRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserBlockCountRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserBlockCountResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.block_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserBlockCountResponse", len)?;
        if self.block_count != 0 {
            struct_ser.serialize_field("blockCount", &self.block_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserBlockCountResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "block_count",
            "blockCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            BlockCount,
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
                            "blockCount" | "block_count" => Ok(GeneratedField::BlockCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetUserBlockCountResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserBlockCountResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserBlockCountResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut block_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::BlockCount => {
                            if block_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("blockCount"));
                            }
                            block_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetUserBlockCountResponse {
                    block_count: block_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserBlockCountResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserIdRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.token.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserIdRequest", len)?;
        if !self.token.is_empty() {
            struct_ser.serialize_field("token", &self.token)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserIdRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "token",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Token,
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
                            "token" => Ok(GeneratedField::Token),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetUserIdRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserIdRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserIdRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut token__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Token => {
                            if token__.is_some() {
                                return Err(serde::de::Error::duplicate_field("token"));
                            }
                            token__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetUserIdRequest {
                    token: token__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserIdRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserIdResponse {
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
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserIdResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserIdResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
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
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetUserIdResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserIdResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserIdResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetUserIdResponse {
                    id: id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserIdResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserMuteCountRequest {
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
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserMuteCountRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserMuteCountRequest {
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
            type Value = GetUserMuteCountRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserMuteCountRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserMuteCountRequest, V::Error>
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
                Ok(GetUserMuteCountRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserMuteCountRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserMuteCountResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.mute_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserMuteCountResponse", len)?;
        if self.mute_count != 0 {
            struct_ser.serialize_field("muteCount", &self.mute_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserMuteCountResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "mute_count",
            "muteCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            MuteCount,
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
                            "muteCount" | "mute_count" => Ok(GeneratedField::MuteCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetUserMuteCountResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserMuteCountResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserMuteCountResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut mute_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::MuteCount => {
                            if mute_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("muteCount"));
                            }
                            mute_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetUserMuteCountResponse {
                    mute_count: mute_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserMuteCountResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserRelationsInfoRequest {
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
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserRelationsInfoRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserRelationsInfoRequest {
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
            type Value = GetUserRelationsInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserRelationsInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserRelationsInfoRequest, V::Error>
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
                Ok(GetUserRelationsInfoRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserRelationsInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserRelationsInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.follower_count != 0 {
            len += 1;
        }
        if self.following_count != 0 {
            len += 1;
        }
        if self.friend_count != 0 {
            len += 1;
        }
        if self.pending_friend_request_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUserRelationsInfoResponse", len)?;
        if self.follower_count != 0 {
            struct_ser.serialize_field("followerCount", &self.follower_count)?;
        }
        if self.following_count != 0 {
            struct_ser.serialize_field("followingCount", &self.following_count)?;
        }
        if self.friend_count != 0 {
            struct_ser.serialize_field("friendCount", &self.friend_count)?;
        }
        if self.pending_friend_request_count != 0 {
            struct_ser.serialize_field("pendingFriendRequestCount", &self.pending_friend_request_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserRelationsInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "follower_count",
            "followerCount",
            "following_count",
            "followingCount",
            "friend_count",
            "friendCount",
            "pending_friend_request_count",
            "pendingFriendRequestCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            FollowerCount,
            FollowingCount,
            FriendCount,
            PendingFriendRequestCount,
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
                            "followerCount" | "follower_count" => Ok(GeneratedField::FollowerCount),
                            "followingCount" | "following_count" => Ok(GeneratedField::FollowingCount),
                            "friendCount" | "friend_count" => Ok(GeneratedField::FriendCount),
                            "pendingFriendRequestCount" | "pending_friend_request_count" => Ok(GeneratedField::PendingFriendRequestCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetUserRelationsInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUserRelationsInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserRelationsInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut follower_count__ = None;
                let mut following_count__ = None;
                let mut friend_count__ = None;
                let mut pending_friend_request_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
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
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::FriendCount => {
                            if friend_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("friendCount"));
                            }
                            friend_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::PendingFriendRequestCount => {
                            if pending_friend_request_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("pendingFriendRequestCount"));
                            }
                            pending_friend_request_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetUserRelationsInfoResponse {
                    follower_count: follower_count__.unwrap_or_default(),
                    following_count: following_count__.unwrap_or_default(),
                    friend_count: friend_count__.unwrap_or_default(),
                    pending_friend_request_count: pending_friend_request_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUserRelationsInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUsernameRequest {
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
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUsernameRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUsernameRequest {
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
            type Value = GetUsernameRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUsernameRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUsernameRequest, V::Error>
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
                Ok(GetUsernameRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUsernameRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUsernameResponse {
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
        let mut struct_ser = serializer.serialize_struct("user_def.v1.GetUsernameResponse", len)?;
        if !self.username.is_empty() {
            struct_ser.serialize_field("username", &self.username)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUsernameResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "username",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Username,
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
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetUsernameResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct user_def.v1.GetUsernameResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUsernameResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut username__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Username => {
                            if username__.is_some() {
                                return Err(serde::de::Error::duplicate_field("username"));
                            }
                            username__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetUsernameResponse {
                    username: username__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("user_def.v1.GetUsernameResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for StatusDuration {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Never => 1,
            Self::Min30 => 2,
            Self::Min60 => 3,
            Self::Hr4 => 4,
            Self::Day1 => 5,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for StatusDuration {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "STATUS_DURATION_UNSPECIFIED",
            "STATUS_DURATION_NEVER",
            "STATUS_DURATION_MIN_30",
            "STATUS_DURATION_MIN_60",
            "STATUS_DURATION_HR_4",
            "STATUS_DURATION_DAY_1",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = StatusDuration;

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
                    .and_then(StatusDuration::from_i32)
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
                    .and_then(StatusDuration::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "STATUS_DURATION_UNSPECIFIED" => Ok(StatusDuration::Unspecified),
                    "STATUS_DURATION_NEVER" => Ok(StatusDuration::Never),
                    "STATUS_DURATION_MIN_30" => Ok(StatusDuration::Min30),
                    "STATUS_DURATION_MIN_60" => Ok(StatusDuration::Min60),
                    "STATUS_DURATION_HR_4" => Ok(StatusDuration::Hr4),
                    "STATUS_DURATION_DAY_1" => Ok(StatusDuration::Day1),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for StatusVisibility {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Global => 1,
            Self::Followers => 2,
            Self::Friends => 3,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for StatusVisibility {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "STATUS_VISIBILITY_UNSPECIFIED",
            "STATUS_VISIBILITY_GLOBAL",
            "STATUS_VISIBILITY_FOLLOWERS",
            "STATUS_VISIBILITY_FRIENDS",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = StatusVisibility;

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
                    .and_then(StatusVisibility::from_i32)
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
                    .and_then(StatusVisibility::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "STATUS_VISIBILITY_UNSPECIFIED" => Ok(StatusVisibility::Unspecified),
                    "STATUS_VISIBILITY_GLOBAL" => Ok(StatusVisibility::Global),
                    "STATUS_VISIBILITY_FOLLOWERS" => Ok(StatusVisibility::Followers),
                    "STATUS_VISIBILITY_FRIENDS" => Ok(StatusVisibility::Friends),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
