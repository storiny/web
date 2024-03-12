// @generated
impl serde::Serialize for GetNotificationSettingsRequest {
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
        let mut struct_ser = serializer.serialize_struct("notification_settings_def.v1.GetNotificationSettingsRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetNotificationSettingsRequest {
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
            type Value = GetNotificationSettingsRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct notification_settings_def.v1.GetNotificationSettingsRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetNotificationSettingsRequest, V::Error>
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
                Ok(GetNotificationSettingsRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("notification_settings_def.v1.GetNotificationSettingsRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetNotificationSettingsResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.features_and_updates {
            len += 1;
        }
        if self.stories {
            len += 1;
        }
        if self.story_likes {
            len += 1;
        }
        if self.tags {
            len += 1;
        }
        if self.comments {
            len += 1;
        }
        if self.replies {
            len += 1;
        }
        if self.new_followers {
            len += 1;
        }
        if self.friend_requests {
            len += 1;
        }
        if self.collaboration_requests {
            len += 1;
        }
        if self.blog_requests {
            len += 1;
        }
        if self.mail_login_activity {
            len += 1;
        }
        if self.mail_features_and_updates {
            len += 1;
        }
        if self.mail_newsletters {
            len += 1;
        }
        if self.mail_digest {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("notification_settings_def.v1.GetNotificationSettingsResponse", len)?;
        if self.features_and_updates {
            struct_ser.serialize_field("featuresAndUpdates", &self.features_and_updates)?;
        }
        if self.stories {
            struct_ser.serialize_field("stories", &self.stories)?;
        }
        if self.story_likes {
            struct_ser.serialize_field("storyLikes", &self.story_likes)?;
        }
        if self.tags {
            struct_ser.serialize_field("tags", &self.tags)?;
        }
        if self.comments {
            struct_ser.serialize_field("comments", &self.comments)?;
        }
        if self.replies {
            struct_ser.serialize_field("replies", &self.replies)?;
        }
        if self.new_followers {
            struct_ser.serialize_field("newFollowers", &self.new_followers)?;
        }
        if self.friend_requests {
            struct_ser.serialize_field("friendRequests", &self.friend_requests)?;
        }
        if self.collaboration_requests {
            struct_ser.serialize_field("collaborationRequests", &self.collaboration_requests)?;
        }
        if self.blog_requests {
            struct_ser.serialize_field("blogRequests", &self.blog_requests)?;
        }
        if self.mail_login_activity {
            struct_ser.serialize_field("mailLoginActivity", &self.mail_login_activity)?;
        }
        if self.mail_features_and_updates {
            struct_ser.serialize_field("mailFeaturesAndUpdates", &self.mail_features_and_updates)?;
        }
        if self.mail_newsletters {
            struct_ser.serialize_field("mailNewsletters", &self.mail_newsletters)?;
        }
        if self.mail_digest {
            struct_ser.serialize_field("mailDigest", &self.mail_digest)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetNotificationSettingsResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "features_and_updates",
            "featuresAndUpdates",
            "stories",
            "story_likes",
            "storyLikes",
            "tags",
            "comments",
            "replies",
            "new_followers",
            "newFollowers",
            "friend_requests",
            "friendRequests",
            "collaboration_requests",
            "collaborationRequests",
            "blog_requests",
            "blogRequests",
            "mail_login_activity",
            "mailLoginActivity",
            "mail_features_and_updates",
            "mailFeaturesAndUpdates",
            "mail_newsletters",
            "mailNewsletters",
            "mail_digest",
            "mailDigest",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            FeaturesAndUpdates,
            Stories,
            StoryLikes,
            Tags,
            Comments,
            Replies,
            NewFollowers,
            FriendRequests,
            CollaborationRequests,
            BlogRequests,
            MailLoginActivity,
            MailFeaturesAndUpdates,
            MailNewsletters,
            MailDigest,
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
                            "featuresAndUpdates" | "features_and_updates" => Ok(GeneratedField::FeaturesAndUpdates),
                            "stories" => Ok(GeneratedField::Stories),
                            "storyLikes" | "story_likes" => Ok(GeneratedField::StoryLikes),
                            "tags" => Ok(GeneratedField::Tags),
                            "comments" => Ok(GeneratedField::Comments),
                            "replies" => Ok(GeneratedField::Replies),
                            "newFollowers" | "new_followers" => Ok(GeneratedField::NewFollowers),
                            "friendRequests" | "friend_requests" => Ok(GeneratedField::FriendRequests),
                            "collaborationRequests" | "collaboration_requests" => Ok(GeneratedField::CollaborationRequests),
                            "blogRequests" | "blog_requests" => Ok(GeneratedField::BlogRequests),
                            "mailLoginActivity" | "mail_login_activity" => Ok(GeneratedField::MailLoginActivity),
                            "mailFeaturesAndUpdates" | "mail_features_and_updates" => Ok(GeneratedField::MailFeaturesAndUpdates),
                            "mailNewsletters" | "mail_newsletters" => Ok(GeneratedField::MailNewsletters),
                            "mailDigest" | "mail_digest" => Ok(GeneratedField::MailDigest),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetNotificationSettingsResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct notification_settings_def.v1.GetNotificationSettingsResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetNotificationSettingsResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut features_and_updates__ = None;
                let mut stories__ = None;
                let mut story_likes__ = None;
                let mut tags__ = None;
                let mut comments__ = None;
                let mut replies__ = None;
                let mut new_followers__ = None;
                let mut friend_requests__ = None;
                let mut collaboration_requests__ = None;
                let mut blog_requests__ = None;
                let mut mail_login_activity__ = None;
                let mut mail_features_and_updates__ = None;
                let mut mail_newsletters__ = None;
                let mut mail_digest__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::FeaturesAndUpdates => {
                            if features_and_updates__.is_some() {
                                return Err(serde::de::Error::duplicate_field("featuresAndUpdates"));
                            }
                            features_and_updates__ = Some(map.next_value()?);
                        }
                        GeneratedField::Stories => {
                            if stories__.is_some() {
                                return Err(serde::de::Error::duplicate_field("stories"));
                            }
                            stories__ = Some(map.next_value()?);
                        }
                        GeneratedField::StoryLikes => {
                            if story_likes__.is_some() {
                                return Err(serde::de::Error::duplicate_field("storyLikes"));
                            }
                            story_likes__ = Some(map.next_value()?);
                        }
                        GeneratedField::Tags => {
                            if tags__.is_some() {
                                return Err(serde::de::Error::duplicate_field("tags"));
                            }
                            tags__ = Some(map.next_value()?);
                        }
                        GeneratedField::Comments => {
                            if comments__.is_some() {
                                return Err(serde::de::Error::duplicate_field("comments"));
                            }
                            comments__ = Some(map.next_value()?);
                        }
                        GeneratedField::Replies => {
                            if replies__.is_some() {
                                return Err(serde::de::Error::duplicate_field("replies"));
                            }
                            replies__ = Some(map.next_value()?);
                        }
                        GeneratedField::NewFollowers => {
                            if new_followers__.is_some() {
                                return Err(serde::de::Error::duplicate_field("newFollowers"));
                            }
                            new_followers__ = Some(map.next_value()?);
                        }
                        GeneratedField::FriendRequests => {
                            if friend_requests__.is_some() {
                                return Err(serde::de::Error::duplicate_field("friendRequests"));
                            }
                            friend_requests__ = Some(map.next_value()?);
                        }
                        GeneratedField::CollaborationRequests => {
                            if collaboration_requests__.is_some() {
                                return Err(serde::de::Error::duplicate_field("collaborationRequests"));
                            }
                            collaboration_requests__ = Some(map.next_value()?);
                        }
                        GeneratedField::BlogRequests => {
                            if blog_requests__.is_some() {
                                return Err(serde::de::Error::duplicate_field("blogRequests"));
                            }
                            blog_requests__ = Some(map.next_value()?);
                        }
                        GeneratedField::MailLoginActivity => {
                            if mail_login_activity__.is_some() {
                                return Err(serde::de::Error::duplicate_field("mailLoginActivity"));
                            }
                            mail_login_activity__ = Some(map.next_value()?);
                        }
                        GeneratedField::MailFeaturesAndUpdates => {
                            if mail_features_and_updates__.is_some() {
                                return Err(serde::de::Error::duplicate_field("mailFeaturesAndUpdates"));
                            }
                            mail_features_and_updates__ = Some(map.next_value()?);
                        }
                        GeneratedField::MailNewsletters => {
                            if mail_newsletters__.is_some() {
                                return Err(serde::de::Error::duplicate_field("mailNewsletters"));
                            }
                            mail_newsletters__ = Some(map.next_value()?);
                        }
                        GeneratedField::MailDigest => {
                            if mail_digest__.is_some() {
                                return Err(serde::de::Error::duplicate_field("mailDigest"));
                            }
                            mail_digest__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetNotificationSettingsResponse {
                    features_and_updates: features_and_updates__.unwrap_or_default(),
                    stories: stories__.unwrap_or_default(),
                    story_likes: story_likes__.unwrap_or_default(),
                    tags: tags__.unwrap_or_default(),
                    comments: comments__.unwrap_or_default(),
                    replies: replies__.unwrap_or_default(),
                    new_followers: new_followers__.unwrap_or_default(),
                    friend_requests: friend_requests__.unwrap_or_default(),
                    collaboration_requests: collaboration_requests__.unwrap_or_default(),
                    blog_requests: blog_requests__.unwrap_or_default(),
                    mail_login_activity: mail_login_activity__.unwrap_or_default(),
                    mail_features_and_updates: mail_features_and_updates__.unwrap_or_default(),
                    mail_newsletters: mail_newsletters__.unwrap_or_default(),
                    mail_digest: mail_digest__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("notification_settings_def.v1.GetNotificationSettingsResponse", FIELDS, GeneratedVisitor)
    }
}
