// @generated
impl serde::Serialize for Device {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.display_name.is_empty() {
            len += 1;
        }
        if self.r#type != 0 {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("login_activity_def.v1.Device", len)?;
        if !self.display_name.is_empty() {
            struct_ser.serialize_field("displayName", &self.display_name)?;
        }
        if self.r#type != 0 {
            let v = DeviceType::from_i32(self.r#type)
                .ok_or_else(|| serde::ser::Error::custom(format!("Invalid variant {}", self.r#type)))?;
            struct_ser.serialize_field("type", &v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for Device {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "display_name",
            "displayName",
            "type",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            DisplayName,
            Type,
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
                            "displayName" | "display_name" => Ok(GeneratedField::DisplayName),
                            "type" => Ok(GeneratedField::Type),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = Device;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct login_activity_def.v1.Device")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<Device, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut display_name__ = None;
                let mut r#type__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::DisplayName => {
                            if display_name__.is_some() {
                                return Err(serde::de::Error::duplicate_field("displayName"));
                            }
                            display_name__ = Some(map.next_value()?);
                        }
                        GeneratedField::Type => {
                            if r#type__.is_some() {
                                return Err(serde::de::Error::duplicate_field("type"));
                            }
                            r#type__ = Some(map.next_value::<DeviceType>()? as i32);
                        }
                    }
                }
                Ok(Device {
                    display_name: display_name__.unwrap_or_default(),
                    r#type: r#type__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("login_activity_def.v1.Device", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for DeviceType {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let variant = match self {
            Self::Unspecified => 0,
            Self::Computer => 1,
            Self::Mobile => 2,
            Self::Tablet => 3,
            Self::Unknown => 4,
        };
        serializer.serialize_i32(variant)
    }
}
impl<'de> serde::Deserialize<'de> for DeviceType {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "DEVICE_TYPE_UNSPECIFIED",
            "DEVICE_TYPE_COMPUTER",
            "DEVICE_TYPE_MOBILE",
            "DEVICE_TYPE_TABLET",
            "DEVICE_TYPE_UNKNOWN",
        ];

        struct GeneratedVisitor;

        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = DeviceType;

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
                    .and_then(DeviceType::from_i32)
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
                    .and_then(DeviceType::from_i32)
                    .ok_or_else(|| {
                        serde::de::Error::invalid_value(serde::de::Unexpected::Unsigned(v), &self)
                    })
            }

            fn visit_str<E>(self, value: &str) -> std::result::Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "DEVICE_TYPE_UNSPECIFIED" => Ok(DeviceType::Unspecified),
                    "DEVICE_TYPE_COMPUTER" => Ok(DeviceType::Computer),
                    "DEVICE_TYPE_MOBILE" => Ok(DeviceType::Mobile),
                    "DEVICE_TYPE_TABLET" => Ok(DeviceType::Tablet),
                    "DEVICE_TYPE_UNKNOWN" => Ok(DeviceType::Unknown),
                    _ => Err(serde::de::Error::unknown_variant(value, FIELDS)),
                }
            }
        }
        deserializer.deserialize_any(GeneratedVisitor)
    }
}
impl serde::Serialize for GetLoginActivityRequest {
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
        if !self.user_id.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("login_activity_def.v1.GetLoginActivityRequest", len)?;
        if !self.token.is_empty() {
            struct_ser.serialize_field("token", &self.token)?;
        }
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetLoginActivityRequest {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "token",
            "user_id",
            "userId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Token,
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
                            "token" => Ok(GeneratedField::Token),
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
            type Value = GetLoginActivityRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct login_activity_def.v1.GetLoginActivityRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetLoginActivityRequest, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut token__ = None;
                let mut user_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Token => {
                            if token__.is_some() {
                                return Err(serde::de::Error::duplicate_field("token"));
                            }
                            token__ = Some(map.next_value()?);
                        }
                        GeneratedField::UserId => {
                            if user_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("userId"));
                            }
                            user_id__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetLoginActivityRequest {
                    token: token__.unwrap_or_default(),
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("login_activity_def.v1.GetLoginActivityRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetLoginActivityResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.recent.is_some() {
            len += 1;
        }
        if !self.logins.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("login_activity_def.v1.GetLoginActivityResponse", len)?;
        if let Some(v) = self.recent.as_ref() {
            struct_ser.serialize_field("recent", v)?;
        }
        if !self.logins.is_empty() {
            struct_ser.serialize_field("logins", &self.logins)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetLoginActivityResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "recent",
            "logins",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Recent,
            Logins,
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
                            "recent" => Ok(GeneratedField::Recent),
                            "logins" => Ok(GeneratedField::Logins),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetLoginActivityResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct login_activity_def.v1.GetLoginActivityResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetLoginActivityResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut recent__ = None;
                let mut logins__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Recent => {
                            if recent__.is_some() {
                                return Err(serde::de::Error::duplicate_field("recent"));
                            }
                            recent__ = map.next_value()?;
                        }
                        GeneratedField::Logins => {
                            if logins__.is_some() {
                                return Err(serde::de::Error::duplicate_field("logins"));
                            }
                            logins__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(GetLoginActivityResponse {
                    recent: recent__,
                    logins: logins__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("login_activity_def.v1.GetLoginActivityResponse", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for Location {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if !self.display_name.is_empty() {
            len += 1;
        }
        if self.lat.is_some() {
            len += 1;
        }
        if self.lng.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("login_activity_def.v1.Location", len)?;
        if !self.display_name.is_empty() {
            struct_ser.serialize_field("displayName", &self.display_name)?;
        }
        if let Some(v) = self.lat.as_ref() {
            struct_ser.serialize_field("lat", v)?;
        }
        if let Some(v) = self.lng.as_ref() {
            struct_ser.serialize_field("lng", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for Location {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "display_name",
            "displayName",
            "lat",
            "lng",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            DisplayName,
            Lat,
            Lng,
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
                            "displayName" | "display_name" => Ok(GeneratedField::DisplayName),
                            "lat" => Ok(GeneratedField::Lat),
                            "lng" => Ok(GeneratedField::Lng),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = Location;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct login_activity_def.v1.Location")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<Location, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut display_name__ = None;
                let mut lat__ = None;
                let mut lng__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::DisplayName => {
                            if display_name__.is_some() {
                                return Err(serde::de::Error::duplicate_field("displayName"));
                            }
                            display_name__ = Some(map.next_value()?);
                        }
                        GeneratedField::Lat => {
                            if lat__.is_some() {
                                return Err(serde::de::Error::duplicate_field("lat"));
                            }
                            lat__ = 
                                map.next_value::<::std::option::Option<::pbjson::private::NumberDeserialize<_>>>()?.map(|x| x.0)
                            ;
                        }
                        GeneratedField::Lng => {
                            if lng__.is_some() {
                                return Err(serde::de::Error::duplicate_field("lng"));
                            }
                            lng__ = 
                                map.next_value::<::std::option::Option<::pbjson::private::NumberDeserialize<_>>>()?.map(|x| x.0)
                            ;
                        }
                    }
                }
                Ok(Location {
                    display_name: display_name__.unwrap_or_default(),
                    lat: lat__,
                    lng: lng__,
                })
            }
        }
        deserializer.deserialize_struct("login_activity_def.v1.Location", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for Login {
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
        if self.device.is_some() {
            len += 1;
        }
        if self.location.is_some() {
            len += 1;
        }
        if self.domain.is_some() {
            len += 1;
        }
        if self.is_active {
            len += 1;
        }
        if !self.created_at.is_empty() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("login_activity_def.v1.Login", len)?;
        if !self.id.is_empty() {
            struct_ser.serialize_field("id", &self.id)?;
        }
        if let Some(v) = self.device.as_ref() {
            struct_ser.serialize_field("device", v)?;
        }
        if let Some(v) = self.location.as_ref() {
            struct_ser.serialize_field("location", v)?;
        }
        if let Some(v) = self.domain.as_ref() {
            struct_ser.serialize_field("domain", v)?;
        }
        if self.is_active {
            struct_ser.serialize_field("isActive", &self.is_active)?;
        }
        if !self.created_at.is_empty() {
            struct_ser.serialize_field("createdAt", &self.created_at)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for Login {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "id",
            "device",
            "location",
            "domain",
            "is_active",
            "isActive",
            "created_at",
            "createdAt",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            Id,
            Device,
            Location,
            Domain,
            IsActive,
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
                            "device" => Ok(GeneratedField::Device),
                            "location" => Ok(GeneratedField::Location),
                            "domain" => Ok(GeneratedField::Domain),
                            "isActive" | "is_active" => Ok(GeneratedField::IsActive),
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
            type Value = Login;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct login_activity_def.v1.Login")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<Login, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut id__ = None;
                let mut device__ = None;
                let mut location__ = None;
                let mut domain__ = None;
                let mut is_active__ = None;
                let mut created_at__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::Id => {
                            if id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("id"));
                            }
                            id__ = Some(map.next_value()?);
                        }
                        GeneratedField::Device => {
                            if device__.is_some() {
                                return Err(serde::de::Error::duplicate_field("device"));
                            }
                            device__ = map.next_value()?;
                        }
                        GeneratedField::Location => {
                            if location__.is_some() {
                                return Err(serde::de::Error::duplicate_field("location"));
                            }
                            location__ = map.next_value()?;
                        }
                        GeneratedField::Domain => {
                            if domain__.is_some() {
                                return Err(serde::de::Error::duplicate_field("domain"));
                            }
                            domain__ = map.next_value()?;
                        }
                        GeneratedField::IsActive => {
                            if is_active__.is_some() {
                                return Err(serde::de::Error::duplicate_field("isActive"));
                            }
                            is_active__ = Some(map.next_value()?);
                        }
                        GeneratedField::CreatedAt => {
                            if created_at__.is_some() {
                                return Err(serde::de::Error::duplicate_field("createdAt"));
                            }
                            created_at__ = Some(map.next_value()?);
                        }
                    }
                }
                Ok(Login {
                    id: id__.unwrap_or_default(),
                    device: device__,
                    location: location__,
                    domain: domain__,
                    is_active: is_active__.unwrap_or_default(),
                    created_at: created_at__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("login_activity_def.v1.Login", FIELDS, GeneratedVisitor)
    }
}
