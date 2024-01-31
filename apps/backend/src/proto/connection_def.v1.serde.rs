// @generated
impl serde::Serialize for Connection {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.provider.is_empty() {
            len += 1;
        }
        if !self.url.is_empty() {
            len += 1;
        }
        if !self.display_name.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("connection_def.v1.Connection", len)?;
        if !self.provider.is_empty() {
            struct_ser.serialize_field("provider", &self.provider)?;
        }
        if !self.url.is_empty() {
            struct_ser.serialize_field("url", &self.url)?;
        }
        if !self.display_name.is_empty() {
            struct_ser.serialize_field("displayName", &self.display_name)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for Connection {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "provider",
            "url",
            "display_name",
            "displayName",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Provider,
            Url,
            DisplayName,
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
                            "provider" => Ok(GeneratedField::Provider),
                            "url" => Ok(GeneratedField::Url),
                            "displayName" | "display_name" => Ok(GeneratedField::DisplayName),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = Connection;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct connection_def.v1.Connection")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<Connection, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut provider__ = None;
                let mut url__ = None;
                let mut display_name__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Provider => {
                            if provider__.is_some() {
                                return Err(serde::de::Error::duplicate_field("provider"));
                            }
                            provider__ = Some(map.next_value()?);
                        }
                        GeneratedField::Url => {
                            if url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("url"));
                            }
                            url__ = Some(map.next_value()?);
                        }
                        GeneratedField::DisplayName => {
                            if display_name__.is_some() {
                                return Err(serde::de::Error::duplicate_field("displayName"));
                            }
                            display_name__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(Connection {
                    provider: provider__.unwrap_or_default(),
                    url: url__.unwrap_or_default(),
                    display_name: display_name__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("connection_def.v1.Connection", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for ConnectionSetting {
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
        if !self.provider.is_empty() {
            len += 1;
        }
        if self.hidden {
            len += 1;
        }
        if !self.display_name.is_empty() {
            len += 1;
        }
        if !self.url.is_empty() {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("connection_def.v1.ConnectionSetting", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if !self.provider.is_empty() {
            struct_ser.serialize_field("provider", &self.provider)?;
        }
        if self.hidden {
            struct_ser.serialize_field("hidden", &self.hidden)?;
        }
        if !self.display_name.is_empty() {
            struct_ser.serialize_field("displayName", &self.display_name)?;
        }
        if !self.url.is_empty() {
            struct_ser.serialize_field("url", &self.url)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for ConnectionSetting {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "provider",
            "hidden",
            "display_name",
            "displayName",
            "url",
            "created_at",
            "createdAt",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Provider,
            Hidden,
            DisplayName,
            Url,
            CreatedAt,
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
                            "provider" => Ok(GeneratedField::Provider),
                            "hidden" => Ok(GeneratedField::Hidden),
                            "displayName" | "display_name" => Ok(GeneratedField::DisplayName),
                            "url" => Ok(GeneratedField::Url),
                            "createdAt" | "created_at" => Ok(GeneratedField::CreatedAt),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = ConnectionSetting;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct connection_def.v1.ConnectionSetting")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<ConnectionSetting, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut provider__ = None;
                let mut hidden__ = None;
                let mut display_name__ = None;
                let mut url__ = None;
                let mut created_at__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Provider => {
                            if provider__.is_some() {
                                return Err(serde::de::Error::duplicate_field("provider"));
                            }
                            provider__ = Some(map.next_value()?);
                        }
                        GeneratedField::Hidden => {
                            if hidden__.is_some() {
                                return Err(serde::de::Error::duplicate_field("hidden"));
                            }
                            hidden__ = Some(map.next_value()?);
                        }
                        GeneratedField::DisplayName => {
                            if display_name__.is_some() {
                                return Err(serde::de::Error::duplicate_field("displayName"));
                            }
                            display_name__ = Some(map.next_value()?);
                        }
                        GeneratedField::Url => {
                            if url__.is_some() {
                                return Err(serde::de::Error::duplicate_field("url"));
                            }
                            url__ = Some(map.next_value()?);
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(ConnectionSetting {
                    id: id__.unwrap_or_default(),
                    provider: provider__.unwrap_or_default(),
                    hidden: hidden__.unwrap_or_default(),
                    display_name: display_name__.unwrap_or_default(),
                    url: url__.unwrap_or_default(),
                    created_at: created_at__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("connection_def.v1.ConnectionSetting", FIELDS, GeneratedVisitor)
    }
}
