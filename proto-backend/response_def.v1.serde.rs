// @generated
impl serde::Serialize for GetResponsesInfoRequest {
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
        let mut struct_ser = serializer.serialize_struct("response_def.v1.GetResponsesInfoRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetResponsesInfoRequest {
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
            type Value = GetResponsesInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct response_def.v1.GetResponsesInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetResponsesInfoRequest, V::Error>
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
                Ok(GetResponsesInfoRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("response_def.v1.GetResponsesInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetResponsesInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.comment_count != 0 {
            len += 1;
        }
        if self.reply_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("response_def.v1.GetResponsesInfoResponse", len)?;
        if self.comment_count != 0 {
            struct_ser.serialize_field("commentCount", &self.comment_count)?;
        }
        if self.reply_count != 0 {
            struct_ser.serialize_field("replyCount", &self.reply_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetResponsesInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "comment_count",
            "commentCount",
            "reply_count",
            "replyCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            CommentCount,
            ReplyCount,
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
                            "commentCount" | "comment_count" => Ok(GeneratedField::CommentCount),
                            "replyCount" | "reply_count" => Ok(GeneratedField::ReplyCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetResponsesInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct response_def.v1.GetResponsesInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetResponsesInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut comment_count__ = None;
                let mut reply_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::CommentCount => {
                            if comment_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("commentCount"));
                            }
                            comment_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::ReplyCount => {
                            if reply_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("replyCount"));
                            }
                            reply_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetResponsesInfoResponse {
                    comment_count: comment_count__.unwrap_or_default(),
                    reply_count: reply_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("response_def.v1.GetResponsesInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoryResponsesInfoRequest {
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
        if !self.story_id.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("response_def.v1.GetStoryResponsesInfoRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        if !self.story_id.is_empty() {
            struct_ser.serialize_field("storyId", &self.story_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoryResponsesInfoRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "user_id",
            "userId",
            "story_id",
            "storyId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            UserId,
            StoryId,
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
                            "storyId" | "story_id" => Ok(GeneratedField::StoryId),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetStoryResponsesInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct response_def.v1.GetStoryResponsesInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoryResponsesInfoRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut user_id__ = None;
                let mut story_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::UserId => {
                            if user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("userId"));
                            }
                            user_id__ = Some(map.next_value()?);
                        }
                        GeneratedField::StoryId => {
                            if story_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("storyId"));
                            }
                            story_id__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetStoryResponsesInfoRequest {
                    user_id: user_id__.unwrap_or_default(),
                    story_id: story_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("response_def.v1.GetStoryResponsesInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoryResponsesInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.total_count != 0 {
            len += 1;
        }
        if self.hidden_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("response_def.v1.GetStoryResponsesInfoResponse", len)?;
        if self.total_count != 0 {
            struct_ser.serialize_field("totalCount", &self.total_count)?;
        }
        if self.hidden_count != 0 {
            struct_ser.serialize_field("hiddenCount", &self.hidden_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoryResponsesInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "total_count",
            "totalCount",
            "hidden_count",
            "hiddenCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            TotalCount,
            HiddenCount,
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
                            "totalCount" | "total_count" => Ok(GeneratedField::TotalCount),
                            "hiddenCount" | "hidden_count" => Ok(GeneratedField::HiddenCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetStoryResponsesInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct response_def.v1.GetStoryResponsesInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoryResponsesInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut total_count__ = None;
                let mut hidden_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::TotalCount => {
                            if total_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("totalCount"));
                            }
                            total_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::HiddenCount => {
                            if hidden_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("hiddenCount"));
                            }
                            hidden_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetStoryResponsesInfoResponse {
                    total_count: total_count__.unwrap_or_default(),
                    hidden_count: hidden_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("response_def.v1.GetStoryResponsesInfoResponse", FIELDS, GeneratedVisitor)
    }
}
