// @generated
impl serde::Serialize for CreateDraftRequest {
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
        let mut struct_ser = serializer.serialize_struct("story_def.v1.CreateDraftRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for CreateDraftRequest {
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
            type Value = CreateDraftRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.CreateDraftRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<CreateDraftRequest, V::Error>
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
                Ok(CreateDraftRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.CreateDraftRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for CreateDraftResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.draft_id.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.CreateDraftResponse", len)?;
        if !self.draft_id.is_empty() {
            struct_ser.serialize_field("draftId", &self.draft_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for CreateDraftResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "draft_id",
            "draftId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            DraftId,
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
                            "draftId" | "draft_id" => Ok(GeneratedField::DraftId),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = CreateDraftResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.CreateDraftResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<CreateDraftResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut draft_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::DraftId => {
                            if draft_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("draftId"));
                            }
                            draft_id__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(CreateDraftResponse {
                    draft_id: draft_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.CreateDraftResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for Draft {
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
        if !self.title.is_empty() {
            len += 1;
        }
        if self.splash_id.is_some() {
            len += 1;
        }
        if self.splash_hex.is_some() {
            len += 1;
        }
        if self.word_count != 0 {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if self.edited_at.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.Draft", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.title.is_empty() {
            struct_ser.serialize_field("title", &self.title)?;
        }
        if let Some(v) = self.splash_id.as_ref() {
            struct_ser.serialize_field("splashId", v)?;
        }
        if let Some(v) = self.splash_hex.as_ref() {
            struct_ser.serialize_field("splashHex", v)?;
        }
        if self.word_count != 0 {
            struct_ser.serialize_field("wordCount", &self.word_count)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if let Some(v) = self.edited_at.as_ref() {
            struct_ser.serialize_field("editedAt", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for Draft {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "title",
            "splash_id",
            "splashId",
            "splash_hex",
            "splashHex",
            "word_count",
            "wordCount",
            "created_at",
            "createdAt",
            "edited_at",
            "editedAt",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Title,
            SplashId,
            SplashHex,
            WordCount,
            CreatedAt,
            EditedAt,
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
                            "title" => Ok(GeneratedField::Title),
                            "splashId" | "splash_id" => Ok(GeneratedField::SplashId),
                            "splashHex" | "splash_hex" => Ok(GeneratedField::SplashHex),
                            "wordCount" | "word_count" => Ok(GeneratedField::WordCount),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "editedAt" | "edited_at" => Ok(GeneratedField::EditedAt),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = Draft;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.Draft")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<Draft, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut title__ = None;
                let mut splash_id__ = None;
                let mut splash_hex__ = None;
                let mut word_count__ = None;
                let mut created_at__ = None;
                let mut edited_at__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Title => {
                            if title__.is_some() {
                                return Err(serde::de::Error::duplicate_field("title"));
                            }
                            title__ = Some(map.next_value()?);
                        }
                        GeneratedField::SplashId => {
                            if splash_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("splashId"));
                            }
                            splash_id__ = map.next_value()?;
                        }
                        GeneratedField::SplashHex => {
                            if splash_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("splashHex"));
                            }
                            splash_hex__ = map.next_value()?;
                        }
                        GeneratedField::WordCount => {
                            if word_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("wordCount"));
                            }
                            word_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                        GeneratedField::EditedAt => {
                            if edited_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("editedAt"));
                            }
                            edited_at__ = map.next_value()?;
                        }
                    }
                }
                Ok(Draft {
                    id: id__.unwrap_or_default(),
                    title: title__.unwrap_or_default(),
                    splash_id: splash_id__,
                    splash_hex: splash_hex__,
                    word_count: word_count__.unwrap_or_default(),
                    created_at: created_at__.unwrap_or_default(),
                    edited_at: edited_at__,
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.Draft", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetContributionsInfoRequest {
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
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetContributionsInfoRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetContributionsInfoRequest {
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
            type Value = GetContributionsInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetContributionsInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetContributionsInfoRequest, V::Error>
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
                Ok(GetContributionsInfoRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetContributionsInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetContributionsInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.contributable_story_count != 0 {
            len += 1;
        }
        if self.pending_collaboration_request_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetContributionsInfoResponse", len)?;
        if self.contributable_story_count != 0 {
            struct_ser.serialize_field("contributableStoryCount", &self.contributable_story_count)?;
        }
        if self.pending_collaboration_request_count != 0 {
            struct_ser.serialize_field("pendingCollaborationRequestCount", &self.pending_collaboration_request_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetContributionsInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "contributable_story_count",
            "contributableStoryCount",
            "pending_collaboration_request_count",
            "pendingCollaborationRequestCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            ContributableStoryCount,
            PendingCollaborationRequestCount,
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
                            "contributableStoryCount" | "contributable_story_count" => Ok(GeneratedField::ContributableStoryCount),
                            "pendingCollaborationRequestCount" | "pending_collaboration_request_count" => Ok(GeneratedField::PendingCollaborationRequestCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetContributionsInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetContributionsInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetContributionsInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut contributable_story_count__ = None;
                let mut pending_collaboration_request_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::ContributableStoryCount => {
                            if contributable_story_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("contributableStoryCount"));
                            }
                            contributable_story_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::PendingCollaborationRequestCount => {
                            if pending_collaboration_request_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("pendingCollaborationRequestCount"));
                            }
                            pending_collaboration_request_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetContributionsInfoResponse {
                    contributable_story_count: contributable_story_count__.unwrap_or_default(),
                    pending_collaboration_request_count: pending_collaboration_request_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetContributionsInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetDraftsInfoRequest {
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
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetDraftsInfoRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetDraftsInfoRequest {
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
            type Value = GetDraftsInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetDraftsInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetDraftsInfoRequest, V::Error>
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
                Ok(GetDraftsInfoRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetDraftsInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetDraftsInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.pending_draft_count != 0 {
            len += 1;
        }
        if self.deleted_draft_count != 0 {
            len += 1;
        }
        if self.latest_draft.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetDraftsInfoResponse", len)?;
        if self.pending_draft_count != 0 {
            struct_ser.serialize_field("pendingDraftCount", &self.pending_draft_count)?;
        }
        if self.deleted_draft_count != 0 {
            struct_ser.serialize_field("deletedDraftCount", &self.deleted_draft_count)?;
        }
        if let Some(v) = self.latest_draft.as_ref() {
            struct_ser.serialize_field("latestDraft", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetDraftsInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "pending_draft_count",
            "pendingDraftCount",
            "deleted_draft_count",
            "deletedDraftCount",
            "latest_draft",
            "latestDraft",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            PendingDraftCount,
            DeletedDraftCount,
            LatestDraft,
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
                            "pendingDraftCount" | "pending_draft_count" => Ok(GeneratedField::PendingDraftCount),
                            "deletedDraftCount" | "deleted_draft_count" => Ok(GeneratedField::DeletedDraftCount),
                            "latestDraft" | "latest_draft" => Ok(GeneratedField::LatestDraft),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetDraftsInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetDraftsInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetDraftsInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut pending_draft_count__ = None;
                let mut deleted_draft_count__ = None;
                let mut latest_draft__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::PendingDraftCount => {
                            if pending_draft_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("pendingDraftCount"));
                            }
                            pending_draft_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::DeletedDraftCount => {
                            if deleted_draft_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("deletedDraftCount"));
                            }
                            deleted_draft_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::LatestDraft => {
                            if latest_draft__.is_some() {
                                return Err(serde::de::Error::duplicate_field("latestDraft"));
                            }
                            latest_draft__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetDraftsInfoResponse {
                    pending_draft_count: pending_draft_count__.unwrap_or_default(),
                    deleted_draft_count: deleted_draft_count__.unwrap_or_default(),
                    latest_draft: latest_draft__,
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetDraftsInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoriesInfoRequest {
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
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetStoriesInfoRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoriesInfoRequest {
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
            type Value = GetStoriesInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetStoriesInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoriesInfoRequest, V::Error>
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
                Ok(GetStoriesInfoRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetStoriesInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoriesInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.published_story_count != 0 {
            len += 1;
        }
        if self.deleted_story_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetStoriesInfoResponse", len)?;
        if self.published_story_count != 0 {
            struct_ser.serialize_field("publishedStoryCount", &self.published_story_count)?;
        }
        if self.deleted_story_count != 0 {
            struct_ser.serialize_field("deletedStoryCount", &self.deleted_story_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoriesInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "published_story_count",
            "publishedStoryCount",
            "deleted_story_count",
            "deletedStoryCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            PublishedStoryCount,
            DeletedStoryCount,
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
                            "publishedStoryCount" | "published_story_count" => Ok(GeneratedField::PublishedStoryCount),
                            "deletedStoryCount" | "deleted_story_count" => Ok(GeneratedField::DeletedStoryCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetStoriesInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetStoriesInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoriesInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut published_story_count__ = None;
                let mut deleted_story_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::PublishedStoryCount => {
                            if published_story_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("publishedStoryCount"));
                            }
                            published_story_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::DeletedStoryCount => {
                            if deleted_story_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("deletedStoryCount"));
                            }
                            deleted_story_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetStoriesInfoResponse {
                    published_story_count: published_story_count__.unwrap_or_default(),
                    deleted_story_count: deleted_story_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetStoriesInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoryMetadataRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.id_or_slug.is_empty() {
            len += 1;
        }
        if !self.user_id.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetStoryMetadataRequest", len)?;
        if !self.id_or_slug.is_empty() {
            struct_ser.serialize_field("idOrSlug", &self.id_or_slug)?;
        }
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoryMetadataRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id_or_slug",
            "idOrSlug",
            "user_id",
            "userId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            IdOrSlug,
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
                            "idOrSlug" | "id_or_slug" => Ok(GeneratedField::IdOrSlug),
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
            type Value = GetStoryMetadataRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetStoryMetadataRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoryMetadataRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id_or_slug__ = None;
                let mut user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::IdOrSlug => {
                            if id_or_slug__.is_some() {
                                return Err(serde::de::Error::duplicate_field("idOrSlug"));
                            }
                            id_or_slug__ = Some(map.next_value()?);
                        }
                        GeneratedField::UserId => {
                            if user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("userId"));
                            }
                            user_id__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetStoryMetadataRequest {
                    id_or_slug: id_or_slug__.unwrap_or_default(),
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetStoryMetadataRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoryMetadataResponse {
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
        if !self.title.is_empty() {
            len += 1;
        }
        if self.slug.is_some() {
            len += 1;
        }
        if self.description.is_some() {
            len += 1;
        }
        if self.splash_id.is_some() {
            len += 1;
        }
        if self.splash_hex.is_some() {
            len += 1;
        }
        if !self.doc_key.is_empty() {
            len += 1;
        }
        if !self.category.is_empty() {
            len += 1;
        }
        if !self.user_id.is_empty() {
            len += 1;
        }
        if !self.role.is_empty() {
            len += 1;
        }
        if self.age_restriction != 0 {
            len += 1;
        }
        if self.license != 0 {
            len += 1;
        }
        if self.visibility != 0 {
            len += 1;
        }
        if self.disable_comments {
            len += 1;
        }
        if self.disable_public_revision_history {
            len += 1;
        }
        if self.disable_toc {
            len += 1;
        }
        if self.canonical_url.is_some() {
            len += 1;
        }
        if self.seo_description.is_some() {
            len += 1;
        }
        if self.seo_title.is_some() {
            len += 1;
        }
        if self.preview_image.is_some() {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if self.edited_at.is_some() {
            len += 1;
        }
        if self.published_at.is_some() {
            len += 1;
        }
        if self.first_published_at.is_some() {
            len += 1;
        }
        if self.deleted_at.is_some() {
            len += 1;
        }
        if self.user.is_some() {
            len += 1;
        }
        if self.blog.is_some() {
            len += 1;
        }
        if !self.tags.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetStoryMetadataResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.title.is_empty() {
            struct_ser.serialize_field("title", &self.title)?;
        }
        if let Some(v) = self.slug.as_ref() {
            struct_ser.serialize_field("slug", v)?;
        }
        if let Some(v) = self.description.as_ref() {
            struct_ser.serialize_field("description", v)?;
        }
        if let Some(v) = self.splash_id.as_ref() {
            struct_ser.serialize_field("splashId", v)?;
        }
        if let Some(v) = self.splash_hex.as_ref() {
            struct_ser.serialize_field("splashHex", v)?;
        }
        if !self.doc_key.is_empty() {
            struct_ser.serialize_field("docKey", &self.doc_key)?;
        }
        if !self.category.is_empty() {
            struct_ser.serialize_field("category", &self.category)?;
        }
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        if !self.role.is_empty() {
            struct_ser.serialize_field("role", &self.role)?;
        }
        if self.age_restriction != 0 {
            let v = StoryAgeRestriction::from_i32(self.age_restriction)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.age_restriction)))?;
            struct_ser.serialize_field("ageRestriction", &v)?;
        }
        if self.license != 0 {
            let v = StoryLicense::from_i32(self.license)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.license)))?;
            struct_ser.serialize_field("license", &v)?;
        }
        if self.visibility != 0 {
            let v = StoryVisibility::from_i32(self.visibility)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.visibility)))?;
            struct_ser.serialize_field("visibility", &v)?;
        }
        if self.disable_comments {
            struct_ser.serialize_field("disableComments", &self.disable_comments)?;
        }
        if self.disable_public_revision_history {
            struct_ser.serialize_field("disablePublicRevisionHistory", &self.disable_public_revision_history)?;
        }
        if self.disable_toc {
            struct_ser.serialize_field("disableToc", &self.disable_toc)?;
        }
        if let Some(v) = self.canonical_url.as_ref() {
            struct_ser.serialize_field("canonicalUrl", v)?;
        }
        if let Some(v) = self.seo_description.as_ref() {
            struct_ser.serialize_field("seoDescription", v)?;
        }
        if let Some(v) = self.seo_title.as_ref() {
            struct_ser.serialize_field("seoTitle", v)?;
        }
        if let Some(v) = self.preview_image.as_ref() {
            struct_ser.serialize_field("previewImage", v)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if let Some(v) = self.edited_at.as_ref() {
            struct_ser.serialize_field("editedAt", v)?;
        }
        if let Some(v) = self.published_at.as_ref() {
            struct_ser.serialize_field("publishedAt", v)?;
        }
        if let Some(v) = self.first_published_at.as_ref() {
            struct_ser.serialize_field("firstPublishedAt", v)?;
        }
        if let Some(v) = self.deleted_at.as_ref() {
            struct_ser.serialize_field("deletedAt", v)?;
        }
        if let Some(v) = self.user.as_ref() {
            struct_ser.serialize_field("user", v)?;
        }
        if let Some(v) = self.blog.as_ref() {
            struct_ser.serialize_field("blog", v)?;
        }
        if !self.tags.is_empty() {
            struct_ser.serialize_field("tags", &self.tags)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoryMetadataResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "title",
            "slug",
            "description",
            "splash_id",
            "splashId",
            "splash_hex",
            "splashHex",
            "doc_key",
            "docKey",
            "category",
            "user_id",
            "userId",
            "role",
            "age_restriction",
            "ageRestriction",
            "license",
            "visibility",
            "disable_comments",
            "disableComments",
            "disable_public_revision_history",
            "disablePublicRevisionHistory",
            "disable_toc",
            "disableToc",
            "canonical_url",
            "canonicalUrl",
            "seo_description",
            "seoDescription",
            "seo_title",
            "seoTitle",
            "preview_image",
            "previewImage",
            "created_at",
            "createdAt",
            "edited_at",
            "editedAt",
            "published_at",
            "publishedAt",
            "first_published_at",
            "firstPublishedAt",
            "deleted_at",
            "deletedAt",
            "user",
            "blog",
            "tags",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Title,
            Slug,
            Description,
            SplashId,
            SplashHex,
            DocKey,
            Category,
            UserId,
            Role,
            AgeRestriction,
            License,
            Visibility,
            DisableComments,
            DisablePublicRevisionHistory,
            DisableToc,
            CanonicalUrl,
            SeoDescription,
            SeoTitle,
            PreviewImage,
            CreatedAt,
            EditedAt,
            PublishedAt,
            FirstPublishedAt,
            DeletedAt,
            User,
            Blog,
            Tags,
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
                            "title" => Ok(GeneratedField::Title),
                            "slug" => Ok(GeneratedField::Slug),
                            "description" => Ok(GeneratedField::Description),
                            "splashId" | "splash_id" => Ok(GeneratedField::SplashId),
                            "splashHex" | "splash_hex" => Ok(GeneratedField::SplashHex),
                            "docKey" | "doc_key" => Ok(GeneratedField::DocKey),
                            "category" => Ok(GeneratedField::Category),
                            "userId" | "user_id" => Ok(GeneratedField::UserId),
                            "role" => Ok(GeneratedField::Role),
                            "ageRestriction" | "age_restriction" => Ok(GeneratedField::AgeRestriction),
                            "license" => Ok(GeneratedField::License),
                            "visibility" => Ok(GeneratedField::Visibility),
                            "disableComments" | "disable_comments" => Ok(GeneratedField::DisableComments),
                            "disablePublicRevisionHistory" | "disable_public_revision_history" => Ok(GeneratedField::DisablePublicRevisionHistory),
                            "disableToc" | "disable_toc" => Ok(GeneratedField::DisableToc),
                            "canonicalUrl" | "canonical_url" => Ok(GeneratedField::CanonicalUrl),
                            "seoDescription" | "seo_description" => Ok(GeneratedField::SeoDescription),
                            "seoTitle" | "seo_title" => Ok(GeneratedField::SeoTitle),
                            "previewImage" | "preview_image" => Ok(GeneratedField::PreviewImage),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "editedAt" | "edited_at" => Ok(GeneratedField::EditedAt),
                            "publishedAt" | "published_at" => Ok(GeneratedField::PublishedAt),
                            "firstPublishedAt" | "first_published_at" => Ok(GeneratedField::FirstPublishedAt),
                            "deletedAt" | "deleted_at" => Ok(GeneratedField::DeletedAt),
                            "user" => Ok(GeneratedField::User),
                            "blog" => Ok(GeneratedField::Blog),
                            "tags" => Ok(GeneratedField::Tags),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetStoryMetadataResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetStoryMetadataResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoryMetadataResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut title__ = None;
                let mut slug__ = None;
                let mut description__ = None;
                let mut splash_id__ = None;
                let mut splash_hex__ = None;
                let mut doc_key__ = None;
                let mut category__ = None;
                let mut user_id__ = None;
                let mut role__ = None;
                let mut age_restriction__ = None;
                let mut license__ = None;
                let mut visibility__ = None;
                let mut disable_comments__ = None;
                let mut disable_public_revision_history__ = None;
                let mut disable_toc__ = None;
                let mut canonical_url__ = None;
                let mut seo_description__ = None;
                let mut seo_title__ = None;
                let mut preview_image__ = None;
                let mut created_at__ = None;
                let mut edited_at__ = None;
                let mut published_at__ = None;
                let mut first_published_at__ = None;
                let mut deleted_at__ = None;
                let mut user__ = None;
                let mut blog__ = None;
                let mut tags__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Title => {
                            if title__.is_some() {
                                return Err(serde::de::Error::duplicate_field("title"));
                            }
                            title__ = Some(map.next_value()?);
                        }
                        GeneratedField::Slug => {
                            if slug__.is_some() {
                                return Err(serde::de::Error::duplicate_field("slug"));
                            }
                            slug__ = map.next_value()?;
                        }
                        GeneratedField::Description => {
                            if description__.is_some() {
                                return Err(serde::de::Error::duplicate_field("description"));
                            }
                            description__ = map.next_value()?;
                        }
                        GeneratedField::SplashId => {
                            if splash_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("splashId"));
                            }
                            splash_id__ = map.next_value()?;
                        }
                        GeneratedField::SplashHex => {
                            if splash_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("splashHex"));
                            }
                            splash_hex__ = map.next_value()?;
                        }
                        GeneratedField::DocKey => {
                            if doc_key__.is_some() {
                                return Err(serde::de::Error::duplicate_field("docKey"));
                            }
                            doc_key__ = Some(map.next_value()?);
                        }
                        GeneratedField::Category => {
                            if category__.is_some() {
                                return Err(serde::de::Error::duplicate_field("category"));
                            }
                            category__ = Some(map.next_value()?);
                        }
                        GeneratedField::UserId => {
                            if user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("userId"));
                            }
                            user_id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Role => {
                            if role__.is_some() {
                                return Err(serde::de::Error::duplicate_field("role"));
                            }
                            role__ = Some(map.next_value()?);
                        }
                        GeneratedField::AgeRestriction => {
                            if age_restriction__.is_some() {
                                return Err(serde::de::Error::duplicate_field("ageRestriction"));
                            }
                            age_restriction__ = Some(map.next_value::<StoryAgeRestriction>()? as i32);
                        }
                        GeneratedField::License => {
                            if license__.is_some() {
                                return Err(serde::de::Error::duplicate_field("license"));
                            }
                            license__ = Some(map.next_value::<StoryLicense>()? as i32);
                        }
                        GeneratedField::Visibility => {
                            if visibility__.is_some() {
                                return Err(serde::de::Error::duplicate_field("visibility"));
                            }
                            visibility__ = Some(map.next_value::<StoryVisibility>()? as i32);
                        }
                        GeneratedField::DisableComments => {
                            if disable_comments__.is_some() {
                                return Err(serde::de::Error::duplicate_field("disableComments"));
                            }
                            disable_comments__ = Some(map.next_value()?);
                        }
                        GeneratedField::DisablePublicRevisionHistory => {
                            if disable_public_revision_history__.is_some() {
                                return Err(serde::de::Error::duplicate_field("disablePublicRevisionHistory"));
                            }
                            disable_public_revision_history__ = Some(map.next_value()?);
                        }
                        GeneratedField::DisableToc => {
                            if disable_toc__.is_some() {
                                return Err(serde::de::Error::duplicate_field("disableToc"));
                            }
                            disable_toc__ = Some(map.next_value()?);
                        }
                        GeneratedField::CanonicalUrl => {
                            if canonical_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("canonicalUrl"));
                            }
                            canonical_url__ = map.next_value()?;
                        }
                        GeneratedField::SeoDescription => {
                            if seo_description__.is_some() {
                                return Err(serde::de::Error::duplicate_field("seoDescription"));
                            }
                            seo_description__ = map.next_value()?;
                        }
                        GeneratedField::SeoTitle => {
                            if seo_title__.is_some() {
                                return Err(serde::de::Error::duplicate_field("seoTitle"));
                            }
                            seo_title__ = map.next_value()?;
                        }
                        GeneratedField::PreviewImage => {
                            if preview_image__.is_some() {
                                return Err(serde::de::Error::duplicate_field("previewImage"));
                            }
                            preview_image__ = map.next_value()?;
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                        GeneratedField::EditedAt => {
                            if edited_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("editedAt"));
                            }
                            edited_at__ = map.next_value()?;
                        }
                        GeneratedField::PublishedAt => {
                            if published_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("publishedAt"));
                            }
                            published_at__ = map.next_value()?;
                        }
                        GeneratedField::FirstPublishedAt => {
                            if first_published_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("firstPublishedAt"));
                            }
                            first_published_at__ = map.next_value()?;
                        }
                        GeneratedField::DeletedAt => {
                            if deleted_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("deletedAt"));
                            }
                            deleted_at__ = map.next_value()?;
                        }
                        GeneratedField::User => {
                            if user__.is_some() {
                                return Err(serde::de::Error::duplicate_field("user"));
                            }
                            user__ = map.next_value()?;
                        }
                        GeneratedField::Blog => {
                            if blog__.is_some() {
                                return Err(serde::de::Error::duplicate_field("blog"));
                            }
                            blog__ = map.next_value()?;
                        }
                        GeneratedField::Tags => {
                            if tags__.is_some() {
                                return Err(serde::de::Error::duplicate_field("tags"));
                            }
                            tags__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetStoryMetadataResponse {
                    id: id__.unwrap_or_default(),
                    title: title__.unwrap_or_default(),
                    slug: slug__,
                    description: description__,
                    splash_id: splash_id__,
                    splash_hex: splash_hex__,
                    doc_key: doc_key__.unwrap_or_default(),
                    category: category__.unwrap_or_default(),
                    user_id: user_id__.unwrap_or_default(),
                    role: role__.unwrap_or_default(),
                    age_restriction: age_restriction__.unwrap_or_default(),
                    license: license__.unwrap_or_default(),
                    visibility: visibility__.unwrap_or_default(),
                    disable_comments: disable_comments__.unwrap_or_default(),
                    disable_public_revision_history: disable_public_revision_history__.unwrap_or_default(),
                    disable_toc: disable_toc__.unwrap_or_default(),
                    canonical_url: canonical_url__,
                    seo_description: seo_description__,
                    seo_title: seo_title__,
                    preview_image: preview_image__,
                    created_at: created_at__.unwrap_or_default(),
                    edited_at: edited_at__,
                    published_at: published_at__,
                    first_published_at: first_published_at__,
                    deleted_at: deleted_at__,
                    user: user__,
                    blog: blog__,
                    tags: tags__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetStoryMetadataResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoryRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.id_or_slug.is_empty() {
            len += 1;
        }
        if self.current_user_id.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetStoryRequest", len)?;
        if !self.id_or_slug.is_empty() {
            struct_ser.serialize_field("idOrSlug", &self.id_or_slug)?;
        }
        if let Some(v) = self.current_user_id.as_ref() {
            struct_ser.serialize_field("currentUserId", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoryRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id_or_slug",
            "idOrSlug",
            "current_user_id",
            "currentUserId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            IdOrSlug,
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
                            "idOrSlug" | "id_or_slug" => Ok(GeneratedField::IdOrSlug),
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
            type Value = GetStoryRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetStoryRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoryRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id_or_slug__ = None;
                let mut current_user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::IdOrSlug => {
                            if id_or_slug__.is_some() {
                                return Err(serde::de::Error::duplicate_field("idOrSlug"));
                            }
                            id_or_slug__ = Some(map.next_value()?);
                        }
                        GeneratedField::CurrentUserId => {
                            if current_user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("currentUserId"));
                            }
                            current_user_id__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetStoryRequest {
                    id_or_slug: id_or_slug__.unwrap_or_default(),
                    current_user_id: current_user_id__,
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetStoryRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetStoryResponse {
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
        if !self.title.is_empty() {
            len += 1;
        }
        if self.slug.is_some() {
            len += 1;
        }
        if self.description.is_some() {
            len += 1;
        }
        if self.splash_id.is_some() {
            len += 1;
        }
        if self.splash_hex.is_some() {
            len += 1;
        }
        if !self.doc_key.is_empty() {
            len += 1;
        }
        if !self.category.is_empty() {
            len += 1;
        }
        if !self.user_id.is_empty() {
            len += 1;
        }
        if self.like_count != 0 {
            len += 1;
        }
        if self.read_count != 0 {
            len += 1;
        }
        if self.word_count != 0 {
            len += 1;
        }
        if self.comment_count != 0 {
            len += 1;
        }
        if self.age_restriction != 0 {
            len += 1;
        }
        if self.license != 0 {
            len += 1;
        }
        if self.visibility != 0 {
            len += 1;
        }
        if self.disable_comments {
            len += 1;
        }
        if self.disable_public_revision_history {
            len += 1;
        }
        if self.disable_toc {
            len += 1;
        }
        if self.canonical_url.is_some() {
            len += 1;
        }
        if self.seo_description.is_some() {
            len += 1;
        }
        if self.seo_title.is_some() {
            len += 1;
        }
        if self.preview_image.is_some() {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if self.edited_at.is_some() {
            len += 1;
        }
        if self.published_at.is_some() {
            len += 1;
        }
        if self.first_published_at.is_some() {
            len += 1;
        }
        if self.deleted_at.is_some() {
            len += 1;
        }
        if self.user.is_some() {
            len += 1;
        }
        if !self.contributors.is_empty() {
            len += 1;
        }
        if !self.tags.is_empty() {
            len += 1;
        }
        if self.blog.is_some() {
            len += 1;
        }
        if self.is_bookmarked {
            len += 1;
        }
        if self.is_liked {
            len += 1;
        }
        if !self.reading_session_token.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("story_def.v1.GetStoryResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.title.is_empty() {
            struct_ser.serialize_field("title", &self.title)?;
        }
        if let Some(v) = self.slug.as_ref() {
            struct_ser.serialize_field("slug", v)?;
        }
        if let Some(v) = self.description.as_ref() {
            struct_ser.serialize_field("description", v)?;
        }
        if let Some(v) = self.splash_id.as_ref() {
            struct_ser.serialize_field("splashId", v)?;
        }
        if let Some(v) = self.splash_hex.as_ref() {
            struct_ser.serialize_field("splashHex", v)?;
        }
        if !self.doc_key.is_empty() {
            struct_ser.serialize_field("docKey", &self.doc_key)?;
        }
        if !self.category.is_empty() {
            struct_ser.serialize_field("category", &self.category)?;
        }
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        if self.like_count != 0 {
            struct_ser.serialize_field("likeCount", &self.like_count)?;
        }
        if self.read_count != 0 {
            struct_ser.serialize_field("readCount", &self.read_count)?;
        }
        if self.word_count != 0 {
            struct_ser.serialize_field("wordCount", &self.word_count)?;
        }
        if self.comment_count != 0 {
            struct_ser.serialize_field("commentCount", &self.comment_count)?;
        }
        if self.age_restriction != 0 {
            let v = StoryAgeRestriction::from_i32(self.age_restriction)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.age_restriction)))?;
            struct_ser.serialize_field("ageRestriction", &v)?;
        }
        if self.license != 0 {
            let v = StoryLicense::from_i32(self.license)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.license)))?;
            struct_ser.serialize_field("license", &v)?;
        }
        if self.visibility != 0 {
            let v = StoryVisibility::from_i32(self.visibility)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.visibility)))?;
            struct_ser.serialize_field("visibility", &v)?;
        }
        if self.disable_comments {
            struct_ser.serialize_field("disableComments", &self.disable_comments)?;
        }
        if self.disable_public_revision_history {
            struct_ser.serialize_field("disablePublicRevisionHistory", &self.disable_public_revision_history)?;
        }
        if self.disable_toc {
            struct_ser.serialize_field("disableToc", &self.disable_toc)?;
        }
        if let Some(v) = self.canonical_url.as_ref() {
            struct_ser.serialize_field("canonicalUrl", v)?;
        }
        if let Some(v) = self.seo_description.as_ref() {
            struct_ser.serialize_field("seoDescription", v)?;
        }
        if let Some(v) = self.seo_title.as_ref() {
            struct_ser.serialize_field("seoTitle", v)?;
        }
        if let Some(v) = self.preview_image.as_ref() {
            struct_ser.serialize_field("previewImage", v)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if let Some(v) = self.edited_at.as_ref() {
            struct_ser.serialize_field("editedAt", v)?;
        }
        if let Some(v) = self.published_at.as_ref() {
            struct_ser.serialize_field("publishedAt", v)?;
        }
        if let Some(v) = self.first_published_at.as_ref() {
            struct_ser.serialize_field("firstPublishedAt", v)?;
        }
        if let Some(v) = self.deleted_at.as_ref() {
            struct_ser.serialize_field("deletedAt", v)?;
        }
        if let Some(v) = self.user.as_ref() {
            struct_ser.serialize_field("user", v)?;
        }
        if !self.contributors.is_empty() {
            struct_ser.serialize_field("contributors", &self.contributors)?;
        }
        if !self.tags.is_empty() {
            struct_ser.serialize_field("tags", &self.tags)?;
        }
        if let Some(v) = self.blog.as_ref() {
            struct_ser.serialize_field("blog", v)?;
        }
        if self.is_bookmarked {
            struct_ser.serialize_field("isBookmarked", &self.is_bookmarked)?;
        }
        if self.is_liked {
            struct_ser.serialize_field("isLiked", &self.is_liked)?;
        }
        if !self.reading_session_token.is_empty() {
            struct_ser.serialize_field("readingSessionToken", &self.reading_session_token)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetStoryResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "title",
            "slug",
            "description",
            "splash_id",
            "splashId",
            "splash_hex",
            "splashHex",
            "doc_key",
            "docKey",
            "category",
            "user_id",
            "userId",
            "like_count",
            "likeCount",
            "read_count",
            "readCount",
            "word_count",
            "wordCount",
            "comment_count",
            "commentCount",
            "age_restriction",
            "ageRestriction",
            "license",
            "visibility",
            "disable_comments",
            "disableComments",
            "disable_public_revision_history",
            "disablePublicRevisionHistory",
            "disable_toc",
            "disableToc",
            "canonical_url",
            "canonicalUrl",
            "seo_description",
            "seoDescription",
            "seo_title",
            "seoTitle",
            "preview_image",
            "previewImage",
            "created_at",
            "createdAt",
            "edited_at",
            "editedAt",
            "published_at",
            "publishedAt",
            "first_published_at",
            "firstPublishedAt",
            "deleted_at",
            "deletedAt",
            "user",
            "contributors",
            "tags",
            "blog",
            "is_bookmarked",
            "isBookmarked",
            "is_liked",
            "isLiked",
            "reading_session_token",
            "readingSessionToken",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Title,
            Slug,
            Description,
            SplashId,
            SplashHex,
            DocKey,
            Category,
            UserId,
            LikeCount,
            ReadCount,
            WordCount,
            CommentCount,
            AgeRestriction,
            License,
            Visibility,
            DisableComments,
            DisablePublicRevisionHistory,
            DisableToc,
            CanonicalUrl,
            SeoDescription,
            SeoTitle,
            PreviewImage,
            CreatedAt,
            EditedAt,
            PublishedAt,
            FirstPublishedAt,
            DeletedAt,
            User,
            Contributors,
            Tags,
            Blog,
            IsBookmarked,
            IsLiked,
            ReadingSessionToken,
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
                            "title" => Ok(GeneratedField::Title),
                            "slug" => Ok(GeneratedField::Slug),
                            "description" => Ok(GeneratedField::Description),
                            "splashId" | "splash_id" => Ok(GeneratedField::SplashId),
                            "splashHex" | "splash_hex" => Ok(GeneratedField::SplashHex),
                            "docKey" | "doc_key" => Ok(GeneratedField::DocKey),
                            "category" => Ok(GeneratedField::Category),
                            "userId" | "user_id" => Ok(GeneratedField::UserId),
                            "likeCount" | "like_count" => Ok(GeneratedField::LikeCount),
                            "readCount" | "read_count" => Ok(GeneratedField::ReadCount),
                            "wordCount" | "word_count" => Ok(GeneratedField::WordCount),
                            "commentCount" | "comment_count" => Ok(GeneratedField::CommentCount),
                            "ageRestriction" | "age_restriction" => Ok(GeneratedField::AgeRestriction),
                            "license" => Ok(GeneratedField::License),
                            "visibility" => Ok(GeneratedField::Visibility),
                            "disableComments" | "disable_comments" => Ok(GeneratedField::DisableComments),
                            "disablePublicRevisionHistory" | "disable_public_revision_history" => Ok(GeneratedField::DisablePublicRevisionHistory),
                            "disableToc" | "disable_toc" => Ok(GeneratedField::DisableToc),
                            "canonicalUrl" | "canonical_url" => Ok(GeneratedField::CanonicalUrl),
                            "seoDescription" | "seo_description" => Ok(GeneratedField::SeoDescription),
                            "seoTitle" | "seo_title" => Ok(GeneratedField::SeoTitle),
                            "previewImage" | "preview_image" => Ok(GeneratedField::PreviewImage),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "editedAt" | "edited_at" => Ok(GeneratedField::EditedAt),
                            "publishedAt" | "published_at" => Ok(GeneratedField::PublishedAt),
                            "firstPublishedAt" | "first_published_at" => Ok(GeneratedField::FirstPublishedAt),
                            "deletedAt" | "deleted_at" => Ok(GeneratedField::DeletedAt),
                            "user" => Ok(GeneratedField::User),
                            "contributors" => Ok(GeneratedField::Contributors),
                            "tags" => Ok(GeneratedField::Tags),
                            "blog" => Ok(GeneratedField::Blog),
                            "isBookmarked" | "is_bookmarked" => Ok(GeneratedField::IsBookmarked),
                            "isLiked" | "is_liked" => Ok(GeneratedField::IsLiked),
                            "readingSessionToken" | "reading_session_token" => Ok(GeneratedField::ReadingSessionToken),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetStoryResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.GetStoryResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetStoryResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut title__ = None;
                let mut slug__ = None;
                let mut description__ = None;
                let mut splash_id__ = None;
                let mut splash_hex__ = None;
                let mut doc_key__ = None;
                let mut category__ = None;
                let mut user_id__ = None;
                let mut like_count__ = None;
                let mut read_count__ = None;
                let mut word_count__ = None;
                let mut comment_count__ = None;
                let mut age_restriction__ = None;
                let mut license__ = None;
                let mut visibility__ = None;
                let mut disable_comments__ = None;
                let mut disable_public_revision_history__ = None;
                let mut disable_toc__ = None;
                let mut canonical_url__ = None;
                let mut seo_description__ = None;
                let mut seo_title__ = None;
                let mut preview_image__ = None;
                let mut created_at__ = None;
                let mut edited_at__ = None;
                let mut published_at__ = None;
                let mut first_published_at__ = None;
                let mut deleted_at__ = None;
                let mut user__ = None;
                let mut contributors__ = None;
                let mut tags__ = None;
                let mut blog__ = None;
                let mut is_bookmarked__ = None;
                let mut is_liked__ = None;
                let mut reading_session_token__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Title => {
                            if title__.is_some() {
                                return Err(serde::de::Error::duplicate_field("title"));
                            }
                            title__ = Some(map.next_value()?);
                        }
                        GeneratedField::Slug => {
                            if slug__.is_some() {
                                return Err(serde::de::Error::duplicate_field("slug"));
                            }
                            slug__ = map.next_value()?;
                        }
                        GeneratedField::Description => {
                            if description__.is_some() {
                                return Err(serde::de::Error::duplicate_field("description"));
                            }
                            description__ = map.next_value()?;
                        }
                        GeneratedField::SplashId => {
                            if splash_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("splashId"));
                            }
                            splash_id__ = map.next_value()?;
                        }
                        GeneratedField::SplashHex => {
                            if splash_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("splashHex"));
                            }
                            splash_hex__ = map.next_value()?;
                        }
                        GeneratedField::DocKey => {
                            if doc_key__.is_some() {
                                return Err(serde::de::Error::duplicate_field("docKey"));
                            }
                            doc_key__ = Some(map.next_value()?);
                        }
                        GeneratedField::Category => {
                            if category__.is_some() {
                                return Err(serde::de::Error::duplicate_field("category"));
                            }
                            category__ = Some(map.next_value()?);
                        }
                        GeneratedField::UserId => {
                            if user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("userId"));
                            }
                            user_id__ = Some(map.next_value()?);
                        }
                        GeneratedField::LikeCount => {
                            if like_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("likeCount"));
                            }
                            like_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::ReadCount => {
                            if read_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("readCount"));
                            }
                            read_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::WordCount => {
                            if word_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("wordCount"));
                            }
                            word_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::CommentCount => {
                            if comment_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("commentCount"));
                            }
                            comment_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::AgeRestriction => {
                            if age_restriction__.is_some() {
                                return Err(serde::de::Error::duplicate_field("ageRestriction"));
                            }
                            age_restriction__ = Some(map.next_value::<StoryAgeRestriction>()? as i32);
                        }
                        GeneratedField::License => {
                            if license__.is_some() {
                                return Err(serde::de::Error::duplicate_field("license"));
                            }
                            license__ = Some(map.next_value::<StoryLicense>()? as i32);
                        }
                        GeneratedField::Visibility => {
                            if visibility__.is_some() {
                                return Err(serde::de::Error::duplicate_field("visibility"));
                            }
                            visibility__ = Some(map.next_value::<StoryVisibility>()? as i32);
                        }
                        GeneratedField::DisableComments => {
                            if disable_comments__.is_some() {
                                return Err(serde::de::Error::duplicate_field("disableComments"));
                            }
                            disable_comments__ = Some(map.next_value()?);
                        }
                        GeneratedField::DisablePublicRevisionHistory => {
                            if disable_public_revision_history__.is_some() {
                                return Err(serde::de::Error::duplicate_field("disablePublicRevisionHistory"));
                            }
                            disable_public_revision_history__ = Some(map.next_value()?);
                        }
                        GeneratedField::DisableToc => {
                            if disable_toc__.is_some() {
                                return Err(serde::de::Error::duplicate_field("disableToc"));
                            }
                            disable_toc__ = Some(map.next_value()?);
                        }
                        GeneratedField::CanonicalUrl => {
                            if canonical_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("canonicalUrl"));
                            }
                            canonical_url__ = map.next_value()?;
                        }
                        GeneratedField::SeoDescription => {
                            if seo_description__.is_some() {
                                return Err(serde::de::Error::duplicate_field("seoDescription"));
                            }
                            seo_description__ = map.next_value()?;
                        }
                        GeneratedField::SeoTitle => {
                            if seo_title__.is_some() {
                                return Err(serde::de::Error::duplicate_field("seoTitle"));
                            }
                            seo_title__ = map.next_value()?;
                        }
                        GeneratedField::PreviewImage => {
                            if preview_image__.is_some() {
                                return Err(serde::de::Error::duplicate_field("previewImage"));
                            }
                            preview_image__ = map.next_value()?;
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                        GeneratedField::EditedAt => {
                            if edited_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("editedAt"));
                            }
                            edited_at__ = map.next_value()?;
                        }
                        GeneratedField::PublishedAt => {
                            if published_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("publishedAt"));
                            }
                            published_at__ = map.next_value()?;
                        }
                        GeneratedField::FirstPublishedAt => {
                            if first_published_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("firstPublishedAt"));
                            }
                            first_published_at__ = map.next_value()?;
                        }
                        GeneratedField::DeletedAt => {
                            if deleted_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("deletedAt"));
                            }
                            deleted_at__ = map.next_value()?;
                        }
                        GeneratedField::User => {
                            if user__.is_some() {
                                return Err(serde::de::Error::duplicate_field("user"));
                            }
                            user__ = map.next_value()?;
                        }
                        GeneratedField::Contributors => {
                            if contributors__.is_some() {
                                return Err(serde::de::Error::duplicate_field("contributors"));
                            }
                            contributors__ = Some(map.next_value()?);
                        }
                        GeneratedField::Tags => {
                            if tags__.is_some() {
                                return Err(serde::de::Error::duplicate_field("tags"));
                            }
                            tags__ = Some(map.next_value()?);
                        }
                        GeneratedField::Blog => {
                            if blog__.is_some() {
                                return Err(serde::de::Error::duplicate_field("blog"));
                            }
                            blog__ = map.next_value()?;
                        }
                        GeneratedField::IsBookmarked => {
                            if is_bookmarked__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isBookmarked"));
                            }
                            is_bookmarked__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsLiked => {
                            if is_liked__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isLiked"));
                            }
                            is_liked__ = Some(map.next_value()?);
                        }
                        GeneratedField::ReadingSessionToken => {
                            if reading_session_token__.is_some() {
                                return Err(serde::de::Error::duplicate_field("readingSessionToken"));
                            }
                            reading_session_token__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetStoryResponse {
                    id: id__.unwrap_or_default(),
                    title: title__.unwrap_or_default(),
                    slug: slug__,
                    description: description__,
                    splash_id: splash_id__,
                    splash_hex: splash_hex__,
                    doc_key: doc_key__.unwrap_or_default(),
                    category: category__.unwrap_or_default(),
                    user_id: user_id__.unwrap_or_default(),
                    like_count: like_count__.unwrap_or_default(),
                    read_count: read_count__.unwrap_or_default(),
                    word_count: word_count__.unwrap_or_default(),
                    comment_count: comment_count__.unwrap_or_default(),
                    age_restriction: age_restriction__.unwrap_or_default(),
                    license: license__.unwrap_or_default(),
                    visibility: visibility__.unwrap_or_default(),
                    disable_comments: disable_comments__.unwrap_or_default(),
                    disable_public_revision_history: disable_public_revision_history__.unwrap_or_default(),
                    disable_toc: disable_toc__.unwrap_or_default(),
                    canonical_url: canonical_url__,
                    seo_description: seo_description__,
                    seo_title: seo_title__,
                    preview_image: preview_image__,
                    created_at: created_at__.unwrap_or_default(),
                    edited_at: edited_at__,
                    published_at: published_at__,
                    first_published_at: first_published_at__,
                    deleted_at: deleted_at__,
                    user: user__,
                    contributors: contributors__.unwrap_or_default(),
                    tags: tags__.unwrap_or_default(),
                    blog: blog__,
                    is_bookmarked: is_bookmarked__.unwrap_or_default(),
                    is_liked: is_liked__.unwrap_or_default(),
                    reading_session_token: reading_session_token__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.GetStoryResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for StoryAgeRestriction {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::NotRated => 1,
            Self::Rated => 2,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for StoryAgeRestriction {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "STORY_AGE_RESTRICTION_UNSPECIFIED",
            "STORY_AGE_RESTRICTION_NOT_RATED",
            "STORY_AGE_RESTRICTION_RATED",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = StoryAgeRestriction;

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
                    .and_then(StoryAgeRestriction::from_i32)
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
                    .and_then(StoryAgeRestriction::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "STORY_AGE_RESTRICTION_UNSPECIFIED" => Ok(StoryAgeRestriction::Unspecified),
                    "STORY_AGE_RESTRICTION_NOT_RATED" => Ok(StoryAgeRestriction::NotRated),
                    "STORY_AGE_RESTRICTION_RATED" => Ok(StoryAgeRestriction::Rated),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for StoryLicense {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Reserved => 1,
            Self::CcZero => 2,
            Self::CcBy => 3,
            Self::CcBySa => 4,
            Self::CcByNd => 5,
            Self::CcByNc => 6,
            Self::CcByNcSa => 7,
            Self::CcByNcNd => 8,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for StoryLicense {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "STORY_LICENSE_UNSPECIFIED",
            "STORY_LICENSE_RESERVED",
            "STORY_LICENSE_CC_ZERO",
            "STORY_LICENSE_CC_BY",
            "STORY_LICENSE_CC_BY_SA",
            "STORY_LICENSE_CC_BY_ND",
            "STORY_LICENSE_CC_BY_NC",
            "STORY_LICENSE_CC_BY_NC_SA",
            "STORY_LICENSE_CC_BY_NC_ND",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = StoryLicense;

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
                    .and_then(StoryLicense::from_i32)
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
                    .and_then(StoryLicense::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "STORY_LICENSE_UNSPECIFIED" => Ok(StoryLicense::Unspecified),
                    "STORY_LICENSE_RESERVED" => Ok(StoryLicense::Reserved),
                    "STORY_LICENSE_CC_ZERO" => Ok(StoryLicense::CcZero),
                    "STORY_LICENSE_CC_BY" => Ok(StoryLicense::CcBy),
                    "STORY_LICENSE_CC_BY_SA" => Ok(StoryLicense::CcBySa),
                    "STORY_LICENSE_CC_BY_ND" => Ok(StoryLicense::CcByNd),
                    "STORY_LICENSE_CC_BY_NC" => Ok(StoryLicense::CcByNc),
                    "STORY_LICENSE_CC_BY_NC_SA" => Ok(StoryLicense::CcByNcSa),
                    "STORY_LICENSE_CC_BY_NC_ND" => Ok(StoryLicense::CcByNcNd),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for StoryVisibility {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Unlisted => 1,
            Self::Public => 2,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for StoryVisibility {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "STORY_VISIBILITY_UNSPECIFIED",
            "STORY_VISIBILITY_UNLISTED",
            "STORY_VISIBILITY_PUBLIC",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = StoryVisibility;

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
                    .and_then(StoryVisibility::from_i32)
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
                    .and_then(StoryVisibility::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "STORY_VISIBILITY_UNSPECIFIED" => Ok(StoryVisibility::Unspecified),
                    "STORY_VISIBILITY_UNLISTED" => Ok(StoryVisibility::Unlisted),
                    "STORY_VISIBILITY_PUBLIC" => Ok(StoryVisibility::Public),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for ValidateStoryRequest {
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
        let mut struct_ser = serializer.serialize_struct("story_def.v1.ValidateStoryRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        if !self.story_id.is_empty() {
            struct_ser.serialize_field("storyId", &self.story_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for ValidateStoryRequest {
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
            type Value = ValidateStoryRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.ValidateStoryRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<ValidateStoryRequest, V::Error>
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
                Ok(ValidateStoryRequest {
                    user_id: user_id__.unwrap_or_default(),
                    story_id: story_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.ValidateStoryRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for ValidateStoryResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let len = 0;
        let struct_ser = serializer.serialize_struct("story_def.v1.ValidateStoryResponse", len)?;
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for ValidateStoryResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
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
                            Err(serde::de::Error::unknown_field(value, FIELDS))
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = ValidateStoryResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct story_def.v1.ValidateStoryResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<ValidateStoryResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                while map.next_key::<GeneratedField>()?.is_some() {
                    let _ = map.next_value::<serde::de::IgnoredAny>()?;
                }
                Ok(ValidateStoryResponse {
                })
            }
        }
        deserializer.deserialize_struct("story_def.v1.ValidateStoryResponse", FIELDS, GeneratedVisitor)
    }
}
