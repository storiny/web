// @generated
impl serde::Serialize for GetFollowedTagCountRequest {
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
        let mut struct_ser = serializer.serialize_struct("tag_def.v1.GetFollowedTagCountRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetFollowedTagCountRequest {
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
            type Value = GetFollowedTagCountRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct tag_def.v1.GetFollowedTagCountRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetFollowedTagCountRequest, V::Error>
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
                Ok(GetFollowedTagCountRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("tag_def.v1.GetFollowedTagCountRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetFollowedTagCountResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.followed_tag_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("tag_def.v1.GetFollowedTagCountResponse", len)?;
        if self.followed_tag_count != 0 {
            struct_ser.serialize_field("followedTagCount", &self.followed_tag_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetFollowedTagCountResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "followed_tag_count",
            "followedTagCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            FollowedTagCount,
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
                            "followedTagCount" | "followed_tag_count" => Ok(GeneratedField::FollowedTagCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetFollowedTagCountResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct tag_def.v1.GetFollowedTagCountResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetFollowedTagCountResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut followed_tag_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::FollowedTagCount => {
                            if followed_tag_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("followedTagCount"));
                            }
                            followed_tag_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetFollowedTagCountResponse {
                    followed_tag_count: followed_tag_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("tag_def.v1.GetFollowedTagCountResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetTagRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.name.is_empty() {
            len += 1;
        }
        if self.current_user_id.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("tag_def.v1.GetTagRequest", len)?;
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if let Some(v) = self.current_user_id.as_ref() {
            struct_ser.serialize_field("currentUserId", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetTagRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "name",
            "current_user_id",
            "currentUserId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Name,
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
                            "name" => Ok(GeneratedField::Name),
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
            type Value = GetTagRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct tag_def.v1.GetTagRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetTagRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut name__ = None;
                let mut current_user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Name => {
                            if name__.is_some() {
                                return Err(serde::de::Error::duplicate_field("name"));
                            }
                            name__ = Some(map.next_value()?);
                        }
                        GeneratedField::CurrentUserId => {
                            if current_user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("currentUserId"));
                            }
                            current_user_id__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetTagRequest {
                    name: name__.unwrap_or_default(),
                    current_user_id: current_user_id__,
                })
            }
        }
        deserializer.deserialize_struct("tag_def.v1.GetTagRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetTagResponse {
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
        if self.story_count != 0 {
            len += 1;
        }
        if self.follower_count != 0 {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if self.is_following {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("tag_def.v1.GetTagResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if self.story_count != 0 {
            struct_ser.serialize_field("storyCount", &self.story_count)?;
        }
        if self.follower_count != 0 {
            struct_ser.serialize_field("followerCount", &self.follower_count)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if self.is_following {
            struct_ser.serialize_field("isFollowing", &self.is_following)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetTagResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
            "story_count",
            "storyCount",
            "follower_count",
            "followerCount",
            "created_at",
            "createdAt",
            "is_following",
            "isFollowing",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
            StoryCount,
            FollowerCount,
            CreatedAt,
            IsFollowing,
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
                            "storyCount" | "story_count" => Ok(GeneratedField::StoryCount),
                            "followerCount" | "follower_count" => Ok(GeneratedField::FollowerCount),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "isFollowing" | "is_following" => Ok(GeneratedField::IsFollowing),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetTagResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct tag_def.v1.GetTagResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetTagResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
                let mut story_count__ = None;
                let mut follower_count__ = None;
                let mut created_at__ = None;
                let mut is_following__ = None;
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
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsFollowing => {
                            if is_following__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isFollowing"));
                            }
                            is_following__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetTagResponse {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                    story_count: story_count__.unwrap_or_default(),
                    follower_count: follower_count__.unwrap_or_default(),
                    created_at: created_at__.unwrap_or_default(),
                    is_following: is_following__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("tag_def.v1.GetTagResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for Tag {
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
        let mut struct_ser = serializer.serialize_struct("tag_def.v1.Tag", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for Tag {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
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
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = Tag;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct tag_def.v1.Tag")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<Tag, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
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
                    }
                }
                Ok(Tag {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("tag_def.v1.Tag", FIELDS, GeneratedVisitor)
    }
}
