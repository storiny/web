// @generated
impl serde::Serialize for ArchiveTimeline {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.year != 0 {
            len += 1;
        }
        if !self.active_months.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.ArchiveTimeline", len)?;
        if self.year != 0 {
            struct_ser.serialize_field("year", &self.year)?;
        }
        if !self.active_months.is_empty() {
            struct_ser.serialize_field("activeMonths", &self.active_months)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for ArchiveTimeline {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "year",
            "active_months",
            "activeMonths",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Year,
            ActiveMonths,
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
                            "year" => Ok(GeneratedField::Year),
                            "activeMonths" | "active_months" => Ok(GeneratedField::ActiveMonths),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = ArchiveTimeline;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.ArchiveTimeline")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<ArchiveTimeline, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut year__ = None;
                let mut active_months__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Year => {
                            if year__.is_some() {
                                return Err(serde::de::Error::duplicate_field("year"));
                            }
                            year__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::ActiveMonths => {
                            if active_months__.is_some() {
                                return Err(serde::de::Error::duplicate_field("activeMonths"));
                            }
                            active_months__ = 
                                Some(map.next_value::<Vec<::pbjson::private::NumberDeserialize<_>>>()?
                                    .into_iter().map(|x| x.0).collect())
                            ;
                        }
                    }
                }
                Ok(ArchiveTimeline {
                    year: year__.unwrap_or_default(),
                    active_months: active_months__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.ArchiveTimeline", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for BareBlog {
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
        if !self.slug.is_empty() {
            len += 1;
        }
        if self.domain.is_some() {
            len += 1;
        }
        if !self.name.is_empty() {
            len += 1;
        }
        if self.logo_id.is_some() {
            len += 1;
        }
        if self.logo_hex.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.BareBlog", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.slug.is_empty() {
            struct_ser.serialize_field("slug", &self.slug)?;
        }
        if let Some(v) = self.domain.as_ref() {
            struct_ser.serialize_field("domain", v)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if let Some(v) = self.logo_id.as_ref() {
            struct_ser.serialize_field("logoId", v)?;
        }
        if let Some(v) = self.logo_hex.as_ref() {
            struct_ser.serialize_field("logoHex", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for BareBlog {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "slug",
            "domain",
            "name",
            "logo_id",
            "logoId",
            "logo_hex",
            "logoHex",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Slug,
            Domain,
            Name,
            LogoId,
            LogoHex,
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
                            "slug" => Ok(GeneratedField::Slug),
                            "domain" => Ok(GeneratedField::Domain),
                            "name" => Ok(GeneratedField::Name),
                            "logoId" | "logo_id" => Ok(GeneratedField::LogoId),
                            "logoHex" | "logo_hex" => Ok(GeneratedField::LogoHex),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = BareBlog;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.BareBlog")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<BareBlog, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut slug__ = None;
                let mut domain__ = None;
                let mut name__ = None;
                let mut logo_id__ = None;
                let mut logo_hex__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Slug => {
                            if slug__.is_some() {
                                return Err(serde::de::Error::duplicate_field("slug"));
                            }
                            slug__ = Some(map.next_value()?);
                        }
                        GeneratedField::Domain => {
                            if domain__.is_some() {
                                return Err(serde::de::Error::duplicate_field("domain"));
                            }
                            domain__ = map.next_value()?;
                        }
                        GeneratedField::Name => {
                            if name__.is_some() {
                                return Err(serde::de::Error::duplicate_field("name"));
                            }
                            name__ = Some(map.next_value()?);
                        }
                        GeneratedField::LogoId => {
                            if logo_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("logoId"));
                            }
                            logo_id__ = map.next_value()?;
                        }
                        GeneratedField::LogoHex => {
                            if logo_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("logoHex"));
                            }
                            logo_hex__ = map.next_value()?;
                        }
                    }
                }
                Ok(BareBlog {
                    id: id__.unwrap_or_default(),
                    slug: slug__.unwrap_or_default(),
                    domain: domain__,
                    name: name__.unwrap_or_default(),
                    logo_id: logo_id__,
                    logo_hex: logo_hex__,
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.BareBlog", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogArchiveRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogArchiveRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogArchiveRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogArchiveRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogArchiveRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogArchiveRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogArchiveRequest {
                    identifier: identifier__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogArchiveRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogArchiveResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.story_count != 0 {
            len += 1;
        }
        if !self.timeline.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogArchiveResponse", len)?;
        if self.story_count != 0 {
            struct_ser.serialize_field("storyCount", &self.story_count)?;
        }
        if !self.timeline.is_empty() {
            struct_ser.serialize_field("timeline", &self.timeline)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogArchiveResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "story_count",
            "storyCount",
            "timeline",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            StoryCount,
            Timeline,
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
                            "storyCount" | "story_count" => Ok(GeneratedField::StoryCount),
                            "timeline" => Ok(GeneratedField::Timeline),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogArchiveResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogArchiveResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogArchiveResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut story_count__ = None;
                let mut timeline__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::StoryCount => {
                            if story_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("storyCount"));
                            }
                            story_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::Timeline => {
                            if timeline__.is_some() {
                                return Err(serde::de::Error::duplicate_field("timeline"));
                            }
                            timeline__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogArchiveResponse {
                    story_count: story_count__.unwrap_or_default(),
                    timeline: timeline__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogArchiveResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogEditorsInfoRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogEditorsInfoRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogEditorsInfoRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogEditorsInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogEditorsInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogEditorsInfoRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogEditorsInfoRequest {
                    identifier: identifier__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogEditorsInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogEditorsInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.editor_count != 0 {
            len += 1;
        }
        if self.pending_editor_request_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogEditorsInfoResponse", len)?;
        if self.editor_count != 0 {
            struct_ser.serialize_field("editorCount", &self.editor_count)?;
        }
        if self.pending_editor_request_count != 0 {
            struct_ser.serialize_field("pendingEditorRequestCount", &self.pending_editor_request_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogEditorsInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "editor_count",
            "editorCount",
            "pending_editor_request_count",
            "pendingEditorRequestCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            EditorCount,
            PendingEditorRequestCount,
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
                            "editorCount" | "editor_count" => Ok(GeneratedField::EditorCount),
                            "pendingEditorRequestCount" | "pending_editor_request_count" => Ok(GeneratedField::PendingEditorRequestCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogEditorsInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogEditorsInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogEditorsInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut editor_count__ = None;
                let mut pending_editor_request_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::EditorCount => {
                            if editor_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("editorCount"));
                            }
                            editor_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::PendingEditorRequestCount => {
                            if pending_editor_request_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("pendingEditorRequestCount"));
                            }
                            pending_editor_request_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetBlogEditorsInfoResponse {
                    editor_count: editor_count__.unwrap_or_default(),
                    pending_editor_request_count: pending_editor_request_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogEditorsInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogNewsletterInfoRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogNewsletterInfoRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogNewsletterInfoRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogNewsletterInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogNewsletterInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogNewsletterInfoRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogNewsletterInfoRequest {
                    identifier: identifier__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogNewsletterInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogNewsletterInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.subscriber_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogNewsletterInfoResponse", len)?;
        if self.subscriber_count != 0 {
            struct_ser.serialize_field("subscriberCount", &self.subscriber_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogNewsletterInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "subscriber_count",
            "subscriberCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            SubscriberCount,
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
                            "subscriberCount" | "subscriber_count" => Ok(GeneratedField::SubscriberCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogNewsletterInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogNewsletterInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogNewsletterInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut subscriber_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::SubscriberCount => {
                            if subscriber_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("subscriberCount"));
                            }
                            subscriber_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetBlogNewsletterInfoResponse {
                    subscriber_count: subscriber_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogNewsletterInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogNewsletterRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        if self.current_user_id.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogNewsletterRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        if let Some(v) = self.current_user_id.as_ref() {
            struct_ser.serialize_field("currentUserId", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogNewsletterRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
            "current_user_id",
            "currentUserId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
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
            type Value = GetBlogNewsletterRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogNewsletterRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogNewsletterRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                let mut current_user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                        GeneratedField::CurrentUserId => {
                            if current_user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("currentUserId"));
                            }
                            current_user_id__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetBlogNewsletterRequest {
                    identifier: identifier__.unwrap_or_default(),
                    current_user_id: current_user_id__,
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogNewsletterRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogNewsletterResponse {
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
        if self.description.is_some() {
            len += 1;
        }
        if self.newsletter_splash_id.is_some() {
            len += 1;
        }
        if self.newsletter_splash_hex.is_some() {
            len += 1;
        }
        if self.user.is_some() {
            len += 1;
        }
        if self.is_subscribed {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogNewsletterResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if let Some(v) = self.description.as_ref() {
            struct_ser.serialize_field("description", v)?;
        }
        if let Some(v) = self.newsletter_splash_id.as_ref() {
            struct_ser.serialize_field("newsletterSplashId", v)?;
        }
        if let Some(v) = self.newsletter_splash_hex.as_ref() {
            struct_ser.serialize_field("newsletterSplashHex", v)?;
        }
        if let Some(v) = self.user.as_ref() {
            struct_ser.serialize_field("user", v)?;
        }
        if self.is_subscribed {
            struct_ser.serialize_field("isSubscribed", &self.is_subscribed)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogNewsletterResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
            "description",
            "newsletter_splash_id",
            "newsletterSplashId",
            "newsletter_splash_hex",
            "newsletterSplashHex",
            "user",
            "is_subscribed",
            "isSubscribed",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
            Description,
            NewsletterSplashId,
            NewsletterSplashHex,
            User,
            IsSubscribed,
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
                            "description" => Ok(GeneratedField::Description),
                            "newsletterSplashId" | "newsletter_splash_id" => Ok(GeneratedField::NewsletterSplashId),
                            "newsletterSplashHex" | "newsletter_splash_hex" => Ok(GeneratedField::NewsletterSplashHex),
                            "user" => Ok(GeneratedField::User),
                            "isSubscribed" | "is_subscribed" => Ok(GeneratedField::IsSubscribed),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogNewsletterResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogNewsletterResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogNewsletterResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
                let mut description__ = None;
                let mut newsletter_splash_id__ = None;
                let mut newsletter_splash_hex__ = None;
                let mut user__ = None;
                let mut is_subscribed__ = None;
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
                        GeneratedField::Description => {
                            if description__.is_some() {
                                return Err(serde::de::Error::duplicate_field("description"));
                            }
                            description__ = map.next_value()?;
                        }
                        GeneratedField::NewsletterSplashId => {
                            if newsletter_splash_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("newsletterSplashId"));
                            }
                            newsletter_splash_id__ = map.next_value()?;
                        }
                        GeneratedField::NewsletterSplashHex => {
                            if newsletter_splash_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("newsletterSplashHex"));
                            }
                            newsletter_splash_hex__ = map.next_value()?;
                        }
                        GeneratedField::User => {
                            if user__.is_some() {
                                return Err(serde::de::Error::duplicate_field("user"));
                            }
                            user__ = map.next_value()?;
                        }
                        GeneratedField::IsSubscribed => {
                            if is_subscribed__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isSubscribed"));
                            }
                            is_subscribed__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogNewsletterResponse {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                    description: description__,
                    newsletter_splash_id: newsletter_splash_id__,
                    newsletter_splash_hex: newsletter_splash_hex__,
                    user: user__,
                    is_subscribed: is_subscribed__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogNewsletterResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogPendingStoryCountRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogPendingStoryCountRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogPendingStoryCountRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogPendingStoryCountRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogPendingStoryCountRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogPendingStoryCountRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogPendingStoryCountRequest {
                    identifier: identifier__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogPendingStoryCountRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogPendingStoryCountResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.pending_story_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogPendingStoryCountResponse", len)?;
        if self.pending_story_count != 0 {
            struct_ser.serialize_field("pendingStoryCount", &self.pending_story_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogPendingStoryCountResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "pending_story_count",
            "pendingStoryCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            PendingStoryCount,
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
                            "pendingStoryCount" | "pending_story_count" => Ok(GeneratedField::PendingStoryCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogPendingStoryCountResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogPendingStoryCountResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogPendingStoryCountResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut pending_story_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::PendingStoryCount => {
                            if pending_story_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("pendingStoryCount"));
                            }
                            pending_story_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetBlogPendingStoryCountResponse {
                    pending_story_count: pending_story_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogPendingStoryCountResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogPublishedStoryCountRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogPublishedStoryCountRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogPublishedStoryCountRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogPublishedStoryCountRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogPublishedStoryCountRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogPublishedStoryCountRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogPublishedStoryCountRequest {
                    identifier: identifier__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogPublishedStoryCountRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogPublishedStoryCountResponse {
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
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogPublishedStoryCountResponse", len)?;
        if self.published_story_count != 0 {
            struct_ser.serialize_field("publishedStoryCount", &self.published_story_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogPublishedStoryCountResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "published_story_count",
            "publishedStoryCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            PublishedStoryCount,
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
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogPublishedStoryCountResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogPublishedStoryCountResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogPublishedStoryCountResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut published_story_count__ = None;
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
                    }
                }
                Ok(GetBlogPublishedStoryCountResponse {
                    published_story_count: published_story_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogPublishedStoryCountResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        if self.current_user_id.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        if let Some(v) = self.current_user_id.as_ref() {
            struct_ser.serialize_field("currentUserId", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
            "current_user_id",
            "currentUserId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
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
            type Value = GetBlogRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                let mut current_user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                        GeneratedField::CurrentUserId => {
                            if current_user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("currentUserId"));
                            }
                            current_user_id__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetBlogRequest {
                    identifier: identifier__.unwrap_or_default(),
                    current_user_id: current_user_id__,
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogResponse {
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
        if !self.slug.is_empty() {
            len += 1;
        }
        if self.description.is_some() {
            len += 1;
        }
        if self.banner_id.is_some() {
            len += 1;
        }
        if self.banner_hex.is_some() {
            len += 1;
        }
        if self.logo_id.is_some() {
            len += 1;
        }
        if self.logo_hex.is_some() {
            len += 1;
        }
        if self.newsletter_splash_id.is_some() {
            len += 1;
        }
        if self.newsletter_splash_hex.is_some() {
            len += 1;
        }
        if self.mark_light.is_some() {
            len += 1;
        }
        if self.mark_dark.is_some() {
            len += 1;
        }
        if self.font_code.is_some() {
            len += 1;
        }
        if self.font_primary.is_some() {
            len += 1;
        }
        if self.font_secondary.is_some() {
            len += 1;
        }
        if self.default_theme.is_some() {
            len += 1;
        }
        if self.force_theme {
            len += 1;
        }
        if self.favicon.is_some() {
            len += 1;
        }
        if self.hide_storiny_branding {
            len += 1;
        }
        if self.is_homepage_large_layout {
            len += 1;
        }
        if self.is_story_minimal_layout {
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
        if self.is_following {
            len += 1;
        }
        if self.is_owner {
            len += 1;
        }
        if self.is_editor {
            len += 1;
        }
        if self.is_writer {
            len += 1;
        }
        if self.is_external {
            len += 1;
        }
        if self.has_plus_features {
            len += 1;
        }
        if self.website_url.is_some() {
            len += 1;
        }
        if self.public_email.is_some() {
            len += 1;
        }
        if self.github_url.is_some() {
            len += 1;
        }
        if self.instagram_url.is_some() {
            len += 1;
        }
        if self.linkedin_url.is_some() {
            len += 1;
        }
        if self.youtube_url.is_some() {
            len += 1;
        }
        if self.twitter_url.is_some() {
            len += 1;
        }
        if self.twitch_url.is_some() {
            len += 1;
        }
        if self.domain.is_some() {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        if !self.category.is_empty() {
            len += 1;
        }
        if !self.user_id.is_empty() {
            len += 1;
        }
        if !self.rsb_items_label.is_empty() {
            len += 1;
        }
        if !self.lsb_items.is_empty() {
            len += 1;
        }
        if !self.rsb_items.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogResponse", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if !self.slug.is_empty() {
            struct_ser.serialize_field("slug", &self.slug)?;
        }
        if let Some(v) = self.description.as_ref() {
            struct_ser.serialize_field("description", v)?;
        }
        if let Some(v) = self.banner_id.as_ref() {
            struct_ser.serialize_field("bannerId", v)?;
        }
        if let Some(v) = self.banner_hex.as_ref() {
            struct_ser.serialize_field("bannerHex", v)?;
        }
        if let Some(v) = self.logo_id.as_ref() {
            struct_ser.serialize_field("logoId", v)?;
        }
        if let Some(v) = self.logo_hex.as_ref() {
            struct_ser.serialize_field("logoHex", v)?;
        }
        if let Some(v) = self.newsletter_splash_id.as_ref() {
            struct_ser.serialize_field("newsletterSplashId", v)?;
        }
        if let Some(v) = self.newsletter_splash_hex.as_ref() {
            struct_ser.serialize_field("newsletterSplashHex", v)?;
        }
        if let Some(v) = self.mark_light.as_ref() {
            struct_ser.serialize_field("markLight", v)?;
        }
        if let Some(v) = self.mark_dark.as_ref() {
            struct_ser.serialize_field("markDark", v)?;
        }
        if let Some(v) = self.font_code.as_ref() {
            struct_ser.serialize_field("fontCode", v)?;
        }
        if let Some(v) = self.font_primary.as_ref() {
            struct_ser.serialize_field("fontPrimary", v)?;
        }
        if let Some(v) = self.font_secondary.as_ref() {
            struct_ser.serialize_field("fontSecondary", v)?;
        }
        if let Some(v) = self.default_theme.as_ref() {
            struct_ser.serialize_field("defaultTheme", v)?;
        }
        if self.force_theme {
            struct_ser.serialize_field("forceTheme", &self.force_theme)?;
        }
        if let Some(v) = self.favicon.as_ref() {
            struct_ser.serialize_field("favicon", v)?;
        }
        if self.hide_storiny_branding {
            struct_ser.serialize_field("hideStorinyBranding", &self.hide_storiny_branding)?;
        }
        if self.is_homepage_large_layout {
            struct_ser.serialize_field("isHomepageLargeLayout", &self.is_homepage_large_layout)?;
        }
        if self.is_story_minimal_layout {
            struct_ser.serialize_field("isStoryMinimalLayout", &self.is_story_minimal_layout)?;
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
        if self.is_following {
            struct_ser.serialize_field("isFollowing", &self.is_following)?;
        }
        if self.is_owner {
            struct_ser.serialize_field("isOwner", &self.is_owner)?;
        }
        if self.is_editor {
            struct_ser.serialize_field("isEditor", &self.is_editor)?;
        }
        if self.is_writer {
            struct_ser.serialize_field("isWriter", &self.is_writer)?;
        }
        if self.is_external {
            struct_ser.serialize_field("isExternal", &self.is_external)?;
        }
        if self.has_plus_features {
            struct_ser.serialize_field("hasPlusFeatures", &self.has_plus_features)?;
        }
        if let Some(v) = self.website_url.as_ref() {
            struct_ser.serialize_field("websiteUrl", v)?;
        }
        if let Some(v) = self.public_email.as_ref() {
            struct_ser.serialize_field("publicEmail", v)?;
        }
        if let Some(v) = self.github_url.as_ref() {
            struct_ser.serialize_field("githubUrl", v)?;
        }
        if let Some(v) = self.instagram_url.as_ref() {
            struct_ser.serialize_field("instagramUrl", v)?;
        }
        if let Some(v) = self.linkedin_url.as_ref() {
            struct_ser.serialize_field("linkedinUrl", v)?;
        }
        if let Some(v) = self.youtube_url.as_ref() {
            struct_ser.serialize_field("youtubeUrl", v)?;
        }
        if let Some(v) = self.twitter_url.as_ref() {
            struct_ser.serialize_field("twitterUrl", v)?;
        }
        if let Some(v) = self.twitch_url.as_ref() {
            struct_ser.serialize_field("twitchUrl", v)?;
        }
        if let Some(v) = self.domain.as_ref() {
            struct_ser.serialize_field("domain", v)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        if !self.category.is_empty() {
            struct_ser.serialize_field("category", &self.category)?;
        }
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        if !self.rsb_items_label.is_empty() {
            struct_ser.serialize_field("rsbItemsLabel", &self.rsb_items_label)?;
        }
        if !self.lsb_items.is_empty() {
            struct_ser.serialize_field("lsbItems", &self.lsb_items)?;
        }
        if !self.rsb_items.is_empty() {
            struct_ser.serialize_field("rsbItems", &self.rsb_items)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
            "slug",
            "description",
            "banner_id",
            "bannerId",
            "banner_hex",
            "bannerHex",
            "logo_id",
            "logoId",
            "logo_hex",
            "logoHex",
            "newsletter_splash_id",
            "newsletterSplashId",
            "newsletter_splash_hex",
            "newsletterSplashHex",
            "mark_light",
            "markLight",
            "mark_dark",
            "markDark",
            "font_code",
            "fontCode",
            "font_primary",
            "fontPrimary",
            "font_secondary",
            "fontSecondary",
            "default_theme",
            "defaultTheme",
            "force_theme",
            "forceTheme",
            "favicon",
            "hide_storiny_branding",
            "hideStorinyBranding",
            "is_homepage_large_layout",
            "isHomepageLargeLayout",
            "is_story_minimal_layout",
            "isStoryMinimalLayout",
            "seo_description",
            "seoDescription",
            "seo_title",
            "seoTitle",
            "preview_image",
            "previewImage",
            "is_following",
            "isFollowing",
            "is_owner",
            "isOwner",
            "is_editor",
            "isEditor",
            "is_writer",
            "isWriter",
            "is_external",
            "isExternal",
            "has_plus_features",
            "hasPlusFeatures",
            "website_url",
            "websiteUrl",
            "public_email",
            "publicEmail",
            "github_url",
            "githubUrl",
            "instagram_url",
            "instagramUrl",
            "linkedin_url",
            "linkedinUrl",
            "youtube_url",
            "youtubeUrl",
            "twitter_url",
            "twitterUrl",
            "twitch_url",
            "twitchUrl",
            "domain",
            "created_at",
            "createdAt",
            "category",
            "user_id",
            "userId",
            "rsb_items_label",
            "rsbItemsLabel",
            "lsb_items",
            "lsbItems",
            "rsb_items",
            "rsbItems",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
            Slug,
            Description,
            BannerId,
            BannerHex,
            LogoId,
            LogoHex,
            NewsletterSplashId,
            NewsletterSplashHex,
            MarkLight,
            MarkDark,
            FontCode,
            FontPrimary,
            FontSecondary,
            DefaultTheme,
            ForceTheme,
            Favicon,
            HideStorinyBranding,
            IsHomepageLargeLayout,
            IsStoryMinimalLayout,
            SeoDescription,
            SeoTitle,
            PreviewImage,
            IsFollowing,
            IsOwner,
            IsEditor,
            IsWriter,
            IsExternal,
            HasPlusFeatures,
            WebsiteUrl,
            PublicEmail,
            GithubUrl,
            InstagramUrl,
            LinkedinUrl,
            YoutubeUrl,
            TwitterUrl,
            TwitchUrl,
            Domain,
            CreatedAt,
            Category,
            UserId,
            RsbItemsLabel,
            LsbItems,
            RsbItems,
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
                            "slug" => Ok(GeneratedField::Slug),
                            "description" => Ok(GeneratedField::Description),
                            "bannerId" | "banner_id" => Ok(GeneratedField::BannerId),
                            "bannerHex" | "banner_hex" => Ok(GeneratedField::BannerHex),
                            "logoId" | "logo_id" => Ok(GeneratedField::LogoId),
                            "logoHex" | "logo_hex" => Ok(GeneratedField::LogoHex),
                            "newsletterSplashId" | "newsletter_splash_id" => Ok(GeneratedField::NewsletterSplashId),
                            "newsletterSplashHex" | "newsletter_splash_hex" => Ok(GeneratedField::NewsletterSplashHex),
                            "markLight" | "mark_light" => Ok(GeneratedField::MarkLight),
                            "markDark" | "mark_dark" => Ok(GeneratedField::MarkDark),
                            "fontCode" | "font_code" => Ok(GeneratedField::FontCode),
                            "fontPrimary" | "font_primary" => Ok(GeneratedField::FontPrimary),
                            "fontSecondary" | "font_secondary" => Ok(GeneratedField::FontSecondary),
                            "defaultTheme" | "default_theme" => Ok(GeneratedField::DefaultTheme),
                            "forceTheme" | "force_theme" => Ok(GeneratedField::ForceTheme),
                            "favicon" => Ok(GeneratedField::Favicon),
                            "hideStorinyBranding" | "hide_storiny_branding" => Ok(GeneratedField::HideStorinyBranding),
                            "isHomepageLargeLayout" | "is_homepage_large_layout" => Ok(GeneratedField::IsHomepageLargeLayout),
                            "isStoryMinimalLayout" | "is_story_minimal_layout" => Ok(GeneratedField::IsStoryMinimalLayout),
                            "seoDescription" | "seo_description" => Ok(GeneratedField::SeoDescription),
                            "seoTitle" | "seo_title" => Ok(GeneratedField::SeoTitle),
                            "previewImage" | "preview_image" => Ok(GeneratedField::PreviewImage),
                            "isFollowing" | "is_following" => Ok(GeneratedField::IsFollowing),
                            "isOwner" | "is_owner" => Ok(GeneratedField::IsOwner),
                            "isEditor" | "is_editor" => Ok(GeneratedField::IsEditor),
                            "isWriter" | "is_writer" => Ok(GeneratedField::IsWriter),
                            "isExternal" | "is_external" => Ok(GeneratedField::IsExternal),
                            "hasPlusFeatures" | "has_plus_features" => Ok(GeneratedField::HasPlusFeatures),
                            "websiteUrl" | "website_url" => Ok(GeneratedField::WebsiteUrl),
                            "publicEmail" | "public_email" => Ok(GeneratedField::PublicEmail),
                            "githubUrl" | "github_url" => Ok(GeneratedField::GithubUrl),
                            "instagramUrl" | "instagram_url" => Ok(GeneratedField::InstagramUrl),
                            "linkedinUrl" | "linkedin_url" => Ok(GeneratedField::LinkedinUrl),
                            "youtubeUrl" | "youtube_url" => Ok(GeneratedField::YoutubeUrl),
                            "twitterUrl" | "twitter_url" => Ok(GeneratedField::TwitterUrl),
                            "twitchUrl" | "twitch_url" => Ok(GeneratedField::TwitchUrl),
                            "domain" => Ok(GeneratedField::Domain),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            "category" => Ok(GeneratedField::Category),
                            "userId" | "user_id" => Ok(GeneratedField::UserId),
                            "rsbItemsLabel" | "rsb_items_label" => Ok(GeneratedField::RsbItemsLabel),
                            "lsbItems" | "lsb_items" => Ok(GeneratedField::LsbItems),
                            "rsbItems" | "rsb_items" => Ok(GeneratedField::RsbItems),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
                let mut slug__ = None;
                let mut description__ = None;
                let mut banner_id__ = None;
                let mut banner_hex__ = None;
                let mut logo_id__ = None;
                let mut logo_hex__ = None;
                let mut newsletter_splash_id__ = None;
                let mut newsletter_splash_hex__ = None;
                let mut mark_light__ = None;
                let mut mark_dark__ = None;
                let mut font_code__ = None;
                let mut font_primary__ = None;
                let mut font_secondary__ = None;
                let mut default_theme__ = None;
                let mut force_theme__ = None;
                let mut favicon__ = None;
                let mut hide_storiny_branding__ = None;
                let mut is_homepage_large_layout__ = None;
                let mut is_story_minimal_layout__ = None;
                let mut seo_description__ = None;
                let mut seo_title__ = None;
                let mut preview_image__ = None;
                let mut is_following__ = None;
                let mut is_owner__ = None;
                let mut is_editor__ = None;
                let mut is_writer__ = None;
                let mut is_external__ = None;
                let mut has_plus_features__ = None;
                let mut website_url__ = None;
                let mut public_email__ = None;
                let mut github_url__ = None;
                let mut instagram_url__ = None;
                let mut linkedin_url__ = None;
                let mut youtube_url__ = None;
                let mut twitter_url__ = None;
                let mut twitch_url__ = None;
                let mut domain__ = None;
                let mut created_at__ = None;
                let mut category__ = None;
                let mut user_id__ = None;
                let mut rsb_items_label__ = None;
                let mut lsb_items__ = None;
                let mut rsb_items__ = None;
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
                        GeneratedField::Slug => {
                            if slug__.is_some() {
                                return Err(serde::de::Error::duplicate_field("slug"));
                            }
                            slug__ = Some(map.next_value()?);
                        }
                        GeneratedField::Description => {
                            if description__.is_some() {
                                return Err(serde::de::Error::duplicate_field("description"));
                            }
                            description__ = map.next_value()?;
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
                        GeneratedField::LogoId => {
                            if logo_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("logoId"));
                            }
                            logo_id__ = map.next_value()?;
                        }
                        GeneratedField::LogoHex => {
                            if logo_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("logoHex"));
                            }
                            logo_hex__ = map.next_value()?;
                        }
                        GeneratedField::NewsletterSplashId => {
                            if newsletter_splash_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("newsletterSplashId"));
                            }
                            newsletter_splash_id__ = map.next_value()?;
                        }
                        GeneratedField::NewsletterSplashHex => {
                            if newsletter_splash_hex__.is_some() {
                                return Err(serde::de::Error::duplicate_field("newsletterSplashHex"));
                            }
                            newsletter_splash_hex__ = map.next_value()?;
                        }
                        GeneratedField::MarkLight => {
                            if mark_light__.is_some() {
                                return Err(serde::de::Error::duplicate_field("markLight"));
                            }
                            mark_light__ = map.next_value()?;
                        }
                        GeneratedField::MarkDark => {
                            if mark_dark__.is_some() {
                                return Err(serde::de::Error::duplicate_field("markDark"));
                            }
                            mark_dark__ = map.next_value()?;
                        }
                        GeneratedField::FontCode => {
                            if font_code__.is_some() {
                                return Err(serde::de::Error::duplicate_field("fontCode"));
                            }
                            font_code__ = map.next_value()?;
                        }
                        GeneratedField::FontPrimary => {
                            if font_primary__.is_some() {
                                return Err(serde::de::Error::duplicate_field("fontPrimary"));
                            }
                            font_primary__ = map.next_value()?;
                        }
                        GeneratedField::FontSecondary => {
                            if font_secondary__.is_some() {
                                return Err(serde::de::Error::duplicate_field("fontSecondary"));
                            }
                            font_secondary__ = map.next_value()?;
                        }
                        GeneratedField::DefaultTheme => {
                            if default_theme__.is_some() {
                                return Err(serde::de::Error::duplicate_field("defaultTheme"));
                            }
                            default_theme__ = map.next_value()?;
                        }
                        GeneratedField::ForceTheme => {
                            if force_theme__.is_some() {
                                return Err(serde::de::Error::duplicate_field("forceTheme"));
                            }
                            force_theme__ = Some(map.next_value()?);
                        }
                        GeneratedField::Favicon => {
                            if favicon__.is_some() {
                                return Err(serde::de::Error::duplicate_field("favicon"));
                            }
                            favicon__ = map.next_value()?;
                        }
                        GeneratedField::HideStorinyBranding => {
                            if hide_storiny_branding__.is_some() {
                                return Err(serde::de::Error::duplicate_field("hideStorinyBranding"));
                            }
                            hide_storiny_branding__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsHomepageLargeLayout => {
                            if is_homepage_large_layout__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isHomepageLargeLayout"));
                            }
                            is_homepage_large_layout__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsStoryMinimalLayout => {
                            if is_story_minimal_layout__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isStoryMinimalLayout"));
                            }
                            is_story_minimal_layout__ = Some(map.next_value()?);
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
                        GeneratedField::IsFollowing => {
                            if is_following__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isFollowing"));
                            }
                            is_following__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsOwner => {
                            if is_owner__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isOwner"));
                            }
                            is_owner__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsEditor => {
                            if is_editor__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isEditor"));
                            }
                            is_editor__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsWriter => {
                            if is_writer__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isWriter"));
                            }
                            is_writer__ = Some(map.next_value()?);
                        }
                        GeneratedField::IsExternal => {
                            if is_external__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isExternal"));
                            }
                            is_external__ = Some(map.next_value()?);
                        }
                        GeneratedField::HasPlusFeatures => {
                            if has_plus_features__.is_some() {
                                return Err(serde::de::Error::duplicate_field("hasPlusFeatures"));
                            }
                            has_plus_features__ = Some(map.next_value()?);
                        }
                        GeneratedField::WebsiteUrl => {
                            if website_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("websiteUrl"));
                            }
                            website_url__ = map.next_value()?;
                        }
                        GeneratedField::PublicEmail => {
                            if public_email__.is_some() {
                                return Err(serde::de::Error::duplicate_field("publicEmail"));
                            }
                            public_email__ = map.next_value()?;
                        }
                        GeneratedField::GithubUrl => {
                            if github_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("githubUrl"));
                            }
                            github_url__ = map.next_value()?;
                        }
                        GeneratedField::InstagramUrl => {
                            if instagram_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("instagramUrl"));
                            }
                            instagram_url__ = map.next_value()?;
                        }
                        GeneratedField::LinkedinUrl => {
                            if linkedin_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("linkedinUrl"));
                            }
                            linkedin_url__ = map.next_value()?;
                        }
                        GeneratedField::YoutubeUrl => {
                            if youtube_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("youtubeUrl"));
                            }
                            youtube_url__ = map.next_value()?;
                        }
                        GeneratedField::TwitterUrl => {
                            if twitter_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("twitterUrl"));
                            }
                            twitter_url__ = map.next_value()?;
                        }
                        GeneratedField::TwitchUrl => {
                            if twitch_url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("twitchUrl"));
                            }
                            twitch_url__ = map.next_value()?;
                        }
                        GeneratedField::Domain => {
                            if domain__.is_some() {
                                return Err(serde::de::Error::duplicate_field("domain"));
                            }
                            domain__ = map.next_value()?;
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
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
                        GeneratedField::RsbItemsLabel => {
                            if rsb_items_label__.is_some() {
                                return Err(serde::de::Error::duplicate_field("rsbItemsLabel"));
                            }
                            rsb_items_label__ = Some(map.next_value()?);
                        }
                        GeneratedField::LsbItems => {
                            if lsb_items__.is_some() {
                                return Err(serde::de::Error::duplicate_field("lsbItems"));
                            }
                            lsb_items__ = Some(map.next_value()?);
                        }
                        GeneratedField::RsbItems => {
                            if rsb_items__.is_some() {
                                return Err(serde::de::Error::duplicate_field("rsbItems"));
                            }
                            rsb_items__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogResponse {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                    slug: slug__.unwrap_or_default(),
                    description: description__,
                    banner_id: banner_id__,
                    banner_hex: banner_hex__,
                    logo_id: logo_id__,
                    logo_hex: logo_hex__,
                    newsletter_splash_id: newsletter_splash_id__,
                    newsletter_splash_hex: newsletter_splash_hex__,
                    mark_light: mark_light__,
                    mark_dark: mark_dark__,
                    font_code: font_code__,
                    font_primary: font_primary__,
                    font_secondary: font_secondary__,
                    default_theme: default_theme__,
                    force_theme: force_theme__.unwrap_or_default(),
                    favicon: favicon__,
                    hide_storiny_branding: hide_storiny_branding__.unwrap_or_default(),
                    is_homepage_large_layout: is_homepage_large_layout__.unwrap_or_default(),
                    is_story_minimal_layout: is_story_minimal_layout__.unwrap_or_default(),
                    seo_description: seo_description__,
                    seo_title: seo_title__,
                    preview_image: preview_image__,
                    is_following: is_following__.unwrap_or_default(),
                    is_owner: is_owner__.unwrap_or_default(),
                    is_editor: is_editor__.unwrap_or_default(),
                    is_writer: is_writer__.unwrap_or_default(),
                    is_external: is_external__.unwrap_or_default(),
                    has_plus_features: has_plus_features__.unwrap_or_default(),
                    website_url: website_url__,
                    public_email: public_email__,
                    github_url: github_url__,
                    instagram_url: instagram_url__,
                    linkedin_url: linkedin_url__,
                    youtube_url: youtube_url__,
                    twitter_url: twitter_url__,
                    twitch_url: twitch_url__,
                    domain: domain__,
                    created_at: created_at__.unwrap_or_default(),
                    category: category__.unwrap_or_default(),
                    user_id: user_id__.unwrap_or_default(),
                    rsb_items_label: rsb_items_label__.unwrap_or_default(),
                    lsb_items: lsb_items__.unwrap_or_default(),
                    rsb_items: rsb_items__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogSitemapRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogSitemapRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogSitemapRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogSitemapRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogSitemapRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogSitemapRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogSitemapRequest {
                    identifier: identifier__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogSitemapRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogSitemapResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.content.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogSitemapResponse", len)?;
        if !self.content.is_empty() {
            struct_ser.serialize_field("content", &self.content)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogSitemapResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "content",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Content,
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
                            "content" => Ok(GeneratedField::Content),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogSitemapResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogSitemapResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogSitemapResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut content__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Content => {
                            if content__.is_some() {
                                return Err(serde::de::Error::duplicate_field("content"));
                            }
                            content__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogSitemapResponse {
                    content: content__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogSitemapResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogWritersInfoRequest {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.identifier.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogWritersInfoRequest", len)?;
        if !self.identifier.is_empty() {
            struct_ser.serialize_field("identifier", &self.identifier)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogWritersInfoRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "identifier",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Identifier,
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
                            "identifier" => Ok(GeneratedField::Identifier),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogWritersInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogWritersInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogWritersInfoRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut identifier__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Identifier => {
                            if identifier__.is_some() {
                                return Err(serde::de::Error::duplicate_field("identifier"));
                            }
                            identifier__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetBlogWritersInfoRequest {
                    identifier: identifier__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogWritersInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetBlogWritersInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.writer_count != 0 {
            len += 1;
        }
        if self.pending_writer_request_count != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetBlogWritersInfoResponse", len)?;
        if self.writer_count != 0 {
            struct_ser.serialize_field("writerCount", &self.writer_count)?;
        }
        if self.pending_writer_request_count != 0 {
            struct_ser.serialize_field("pendingWriterRequestCount", &self.pending_writer_request_count)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetBlogWritersInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "writer_count",
            "writerCount",
            "pending_writer_request_count",
            "pendingWriterRequestCount",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            WriterCount,
            PendingWriterRequestCount,
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
                            "writerCount" | "writer_count" => Ok(GeneratedField::WriterCount),
                            "pendingWriterRequestCount" | "pending_writer_request_count" => Ok(GeneratedField::PendingWriterRequestCount),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetBlogWritersInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetBlogWritersInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetBlogWritersInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut writer_count__ = None;
                let mut pending_writer_request_count__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::WriterCount => {
                            if writer_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("writerCount"));
                            }
                            writer_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::PendingWriterRequestCount => {
                            if pending_writer_request_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("pendingWriterRequestCount"));
                            }
                            pending_writer_request_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                    }
                }
                Ok(GetBlogWritersInfoResponse {
                    writer_count: writer_count__.unwrap_or_default(),
                    pending_writer_request_count: pending_writer_request_count__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetBlogWritersInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserBlogsInfoRequest {
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
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetUserBlogsInfoRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserBlogsInfoRequest {
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
            type Value = GetUserBlogsInfoRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetUserBlogsInfoRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserBlogsInfoRequest, V::Error>
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
                Ok(GetUserBlogsInfoRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetUserBlogsInfoRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetUserBlogsInfoResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.blog_count != 0 {
            len += 1;
        }
        if self.pending_blog_request_count != 0 {
            len += 1;
        }
        if self.can_create_blog {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.GetUserBlogsInfoResponse", len)?;
        if self.blog_count != 0 {
            struct_ser.serialize_field("blogCount", &self.blog_count)?;
        }
        if self.pending_blog_request_count != 0 {
            struct_ser.serialize_field("pendingBlogRequestCount", &self.pending_blog_request_count)?;
        }
        if self.can_create_blog {
            struct_ser.serialize_field("canCreateBlog", &self.can_create_blog)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetUserBlogsInfoResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "blog_count",
            "blogCount",
            "pending_blog_request_count",
            "pendingBlogRequestCount",
            "can_create_blog",
            "canCreateBlog",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            BlogCount,
            PendingBlogRequestCount,
            CanCreateBlog,
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
                            "blogCount" | "blog_count" => Ok(GeneratedField::BlogCount),
                            "pendingBlogRequestCount" | "pending_blog_request_count" => Ok(GeneratedField::PendingBlogRequestCount),
                            "canCreateBlog" | "can_create_blog" => Ok(GeneratedField::CanCreateBlog),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetUserBlogsInfoResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.GetUserBlogsInfoResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetUserBlogsInfoResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut blog_count__ = None;
                let mut pending_blog_request_count__ = None;
                let mut can_create_blog__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::BlogCount => {
                            if blog_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("blogCount"));
                            }
                            blog_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::PendingBlogRequestCount => {
                            if pending_blog_request_count__.is_some() {
                                return Err(serde::de::Error::duplicate_field("pendingBlogRequestCount"));
                            }
                            pending_blog_request_count__ = 
                                Some(map.next_value::<::pbjson::private::NumberDeserialize<_>>()?.0)
                            ;
                        }
                        GeneratedField::CanCreateBlog => {
                            if can_create_blog__.is_some() {
                                return Err(serde::de::Error::duplicate_field("canCreateBlog"));
                            }
                            can_create_blog__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetUserBlogsInfoResponse {
                    blog_count: blog_count__.unwrap_or_default(),
                    pending_blog_request_count: pending_blog_request_count__.unwrap_or_default(),
                    can_create_blog: can_create_blog__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.GetUserBlogsInfoResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for LeftSidebarItem {
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
        if self.icon.is_some() {
            len += 1;
        }
        if !self.target.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.LeftSidebarItem", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.name.is_empty() {
            struct_ser.serialize_field("name", &self.name)?;
        }
        if let Some(v) = self.icon.as_ref() {
            struct_ser.serialize_field("icon", v)?;
        }
        if !self.target.is_empty() {
            struct_ser.serialize_field("target", &self.target)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for LeftSidebarItem {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "name",
            "icon",
            "target",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Name,
            Icon,
            Target,
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
                            "icon" => Ok(GeneratedField::Icon),
                            "target" => Ok(GeneratedField::Target),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = LeftSidebarItem;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.LeftSidebarItem")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<LeftSidebarItem, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut name__ = None;
                let mut icon__ = None;
                let mut target__ = None;
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
                        GeneratedField::Icon => {
                            if icon__.is_some() {
                                return Err(serde::de::Error::duplicate_field("icon"));
                            }
                            icon__ = map.next_value()?;
                        }
                        GeneratedField::Target => {
                            if target__.is_some() {
                                return Err(serde::de::Error::duplicate_field("target"));
                            }
                            target__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(LeftSidebarItem {
                    id: id__.unwrap_or_default(),
                    name: name__.unwrap_or_default(),
                    icon: icon__,
                    target: target__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.LeftSidebarItem", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for RightSidebarItem {
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
        if !self.primary_text.is_empty() {
            len += 1;
        }
        if self.secondary_text.is_some() {
            len += 1;
        }
        if self.icon.is_some() {
            len += 1;
        }
        if !self.target.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("blog_def.v1.RightSidebarItem", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.primary_text.is_empty() {
            struct_ser.serialize_field("primaryText", &self.primary_text)?;
        }
        if let Some(v) = self.secondary_text.as_ref() {
            struct_ser.serialize_field("secondaryText", v)?;
        }
        if let Some(v) = self.icon.as_ref() {
            struct_ser.serialize_field("icon", v)?;
        }
        if !self.target.is_empty() {
            struct_ser.serialize_field("target", &self.target)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for RightSidebarItem {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "primary_text",
            "primaryText",
            "secondary_text",
            "secondaryText",
            "icon",
            "target",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            PrimaryText,
            SecondaryText,
            Icon,
            Target,
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
                            "primaryText" | "primary_text" => Ok(GeneratedField::PrimaryText),
                            "secondaryText" | "secondary_text" => Ok(GeneratedField::SecondaryText),
                            "icon" => Ok(GeneratedField::Icon),
                            "target" => Ok(GeneratedField::Target),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = RightSidebarItem;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct blog_def.v1.RightSidebarItem")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<RightSidebarItem, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut primary_text__ = None;
                let mut secondary_text__ = None;
                let mut icon__ = None;
                let mut target__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::PrimaryText => {
                            if primary_text__.is_some() {
                                return Err(serde::de::Error::duplicate_field("primaryText"));
                            }
                            primary_text__ = Some(map.next_value()?);
                        }
                        GeneratedField::SecondaryText => {
                            if secondary_text__.is_some() {
                                return Err(serde::de::Error::duplicate_field("secondaryText"));
                            }
                            secondary_text__ = map.next_value()?;
                        }
                        GeneratedField::Icon => {
                            if icon__.is_some() {
                                return Err(serde::de::Error::duplicate_field("icon"));
                            }
                            icon__ = map.next_value()?;
                        }
                        GeneratedField::Target => {
                            if target__.is_some() {
                                return Err(serde::de::Error::duplicate_field("target"));
                            }
                            target__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(RightSidebarItem {
                    id: id__.unwrap_or_default(),
                    primary_text: primary_text__.unwrap_or_default(),
                    secondary_text: secondary_text__,
                    icon: icon__,
                    target: target__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("blog_def.v1.RightSidebarItem", FIELDS, GeneratedVisitor)
    }
}
