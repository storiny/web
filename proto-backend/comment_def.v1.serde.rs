// @generated
impl serde::Serialize for GetCommentRequest {
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
        if self.current_user_id.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("comment_def.v1.GetCommentRequest", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if let Some(v) = self.current_user_id.as_ref() {
            struct_ser.serialize_field("currentUserId", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetCommentRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "current_user_id",
            "currentUserId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
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
                            "id" => Ok(GeneratedField::Id),
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
            type Value = GetCommentRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct comment_def.v1.GetCommentRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetCommentRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut current_user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::CurrentUserId => {
                            if current_user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("currentUserId"));
                            }
                            current_user_id__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetCommentRequest {
                    id: id__.unwrap_or_default(),
                    current_user_id: current_user_id__,
                })
            }
        }
        deserializer.deserialize_struct("comment_def.v1.GetCommentRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetCommentResponse {
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
        if !self.content.is_empty() {
            len += 1;
        }
        if !self.rendered_content.is_empty() {
            len += 1;
        }
        if !self.user_id.is_empty() {
            len += 1;
        }
        if !self.story_id.is_empty() {
            len += 1;
        }
        if !self.story_slug.is_empty() {
            len += 1;
        }
        if !self.story_writer_username.is_empty() {
            len += 1;
        }
        if self.hidden {
            len += 1;
        }
        if self.edited_at.is_some() {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if self.like_count != 0 {
            len += 1;
        }
        if self.reply_count != 0 {
            len += 1;
        }
        if self.user.is_some() {
            len += 1;
        }
        if self.is_liked {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("comment_def.v1.GetCommentResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.content.is_empty() {
            struct_ser.serialize_field("content", &self.content)?;
        }
        if !self.rendered_content.is_empty() {
            struct_ser.serialize_field("renderedContent", &self.rendered_content)?;
        }
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        if !self.story_id.is_empty() {
            struct_ser.serialize_field("storyId", &self.story_id)?;
        }
        if !self.story_slug.is_empty() {
            struct_ser.serialize_field("storySlug", &self.story_slug)?;
        }
        if !self.story_writer_username.is_empty() {
            struct_ser.serialize_field("storyWriterUsername", &self.story_writer_username)?;
        }
        if self.hidden {
            struct_ser.serialize_field("hidden", &self.hidden)?;
        }
        if let Some(v) = self.edited_at.as_ref() {
            struct_ser.serialize_field("editedAt", v)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if self.like_count != 0 {
            struct_ser.serialize_field("likeCount", &self.like_count)?;
        }
        if self.reply_count != 0 {
            struct_ser.serialize_field("replyCount", &self.reply_count)?;
        }
        if let Some(v) = self.user.as_ref() {
            struct_ser.serialize_field("user", v)?;
        }
        if self.is_liked {
            struct_ser.serialize_field("isLiked", &self.is_liked)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetCommentResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "content",
            "rendered_content",
            "renderedContent",
            "user_id",
            "userId",
            "story_id",
            "storyId",
            "story_slug",
            "storySlug",
            "story_writer_username",
            "storyWriterUsername",
            "hidden",
            "edited_at",
            "editedAt",
            "created_at",
            "createdAt",
            "like_count",
            "likeCount",
            "reply_count",
            "replyCount",
            "user",
            "is_liked",
            "isLiked",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Content,
            RenderedContent,
            UserId,
            StoryId,
            StorySlug,
            StoryWriterUsername,
            Hidden,
            EditedAt,
            CreatedAt,
            LikeCount,
            ReplyCount,
            User,
            IsLiked,
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
                            "content" => Ok(GeneratedField::Content),
                            "renderedContent" | "rendered_content" => Ok(GeneratedField::RenderedContent),
                            "userId" | "user_id" => Ok(GeneratedField::UserId),
                            "storyId" | "story_id" => Ok(GeneratedField::StoryId),
                            "storySlug" | "story_slug" => Ok(GeneratedField::StorySlug),
                            "storyWriterUsername" | "story_writer_username" => Ok(GeneratedField::StoryWriterUsername),
                            "hidden" => Ok(GeneratedField::Hidden),
                            "editedAt" | "edited_at" => Ok(GeneratedField::EditedAt),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "likeCount" | "like_count" => Ok(GeneratedField::LikeCount),
                            "replyCount" | "reply_count" => Ok(GeneratedField::ReplyCount),
                            "user" => Ok(GeneratedField::User),
                            "isLiked" | "is_liked" => Ok(GeneratedField::IsLiked),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetCommentResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct comment_def.v1.GetCommentResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetCommentResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut content__ = None;
                let mut rendered_content__ = None;
                let mut user_id__ = None;
                let mut story_id__ = None;
                let mut story_slug__ = None;
                let mut story_writer_username__ = None;
                let mut hidden__ = None;
                let mut edited_at__ = None;
                let mut created_at__ = None;
                let mut like_count__ = None;
                let mut reply_count__ = None;
                let mut user__ = None;
                let mut is_liked__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Content => {
                            if content__.is_some() {
                                return Err(serde::de::Error::duplicate_field("content"));
                            }
                            content__ = Some(map.next_value()?);
                        }
                        GeneratedField::RenderedContent => {
                            if rendered_content__.is_some() {
                                return Err(serde::de::Error::duplicate_field("renderedContent"));
                            }
                            rendered_content__ = Some(map.next_value()?);
                        }
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
                        GeneratedField::StorySlug => {
                            if story_slug__.is_some() {
                                return Err(serde::de::Error::duplicate_field("storySlug"));
                            }
                            story_slug__ = Some(map.next_value()?);
                        }
                        GeneratedField::StoryWriterUsername => {
                            if story_writer_username__.is_some() {
                                return Err(serde::de::Error::duplicate_field("storyWriterUsername"));
                            }
                            story_writer_username__ = Some(map.next_value()?);
                        }
                        GeneratedField::Hidden => {
                            if hidden__.is_some() {
                                return Err(serde::de::Error::duplicate_field("hidden"));
                            }
                            hidden__ = Some(map.next_value()?);
                        }
                        GeneratedField::EditedAt => {
                            if edited_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("editedAt"));
                            }
                            edited_at__ = map.next_value()?;
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                        GeneratedField::LikeCount => {
                            if like_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("likeCount"));
                            }
                            like_count__ = 
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
                        GeneratedField::User => {
                            if user__.is_some() {
                                return Err(serde::de::Error::duplicate_field("user"));
                            }
                            user__ = map.next_value()?;
                        }
                        GeneratedField::IsLiked => {
                            if is_liked__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isLiked"));
                            }
                            is_liked__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetCommentResponse {
                    id: id__.unwrap_or_default(),
                    content: content__.unwrap_or_default(),
                    rendered_content: rendered_content__.unwrap_or_default(),
                    user_id: user_id__.unwrap_or_default(),
                    story_id: story_id__.unwrap_or_default(),
                    story_slug: story_slug__.unwrap_or_default(),
                    story_writer_username: story_writer_username__.unwrap_or_default(),
                    hidden: hidden__.unwrap_or_default(),
                    edited_at: edited_at__,
                    created_at: created_at__.unwrap_or_default(),
                    like_count: like_count__.unwrap_or_default(),
                    reply_count: reply_count__.unwrap_or_default(),
                    user: user__,
                    is_liked: is_liked__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("comment_def.v1.GetCommentResponse", FIELDS, GeneratedVisitor)
    }
}
