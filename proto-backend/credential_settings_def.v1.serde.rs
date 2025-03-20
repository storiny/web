// @generated
impl serde::Serialize for GetCredentialSettingsRequest {
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
        let mut struct_ser = serializer.serialize_struct("credential_settings_def.v1.GetCredentialSettingsRequest", len)?;
        if !self.user_id.is_empty() {
            struct_ser.serialize_field("userId", &self.user_id)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetCredentialSettingsRequest {
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
            type Value = GetCredentialSettingsRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct credential_settings_def.v1.GetCredentialSettingsRequest")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetCredentialSettingsRequest, V::Error>
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
                Ok(GetCredentialSettingsRequest {
                    user_id: user_id__.unwrap_or_default(),
                })
            }
        }
        deserializer.deserialize_struct("credential_settings_def.v1.GetCredentialSettingsRequest", FIELDS, GeneratedVisitor)
    }
}
impl serde::Serialize for GetCredentialSettingsResponse {
    #[allow(deprecated)]
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut len = 0;
        if self.has_password {
            len += 1;
        }
        if self.mfa_enabled {
            len += 1;
        }
        if self.login_apple_id.is_some() {
            len += 1;
        }
        if self.login_google_id.is_some() {
            len += 1;
        }
        let mut struct_ser = serializer.serialize_struct("credential_settings_def.v1.GetCredentialSettingsResponse", len)?;
        if self.has_password {
            struct_ser.serialize_field("hasPassword", &self.has_password)?;
        }
        if self.mfa_enabled {
            struct_ser.serialize_field("mfaEnabled", &self.mfa_enabled)?;
        }
        if let Some(v) = self.login_apple_id.as_ref() {
            struct_ser.serialize_field("loginAppleId", v)?;
        }
        if let Some(v) = self.login_google_id.as_ref() {
            struct_ser.serialize_field("loginGoogleId", v)?;
        }
        struct_ser.end()
    }
}
impl<'de> serde::Deserialize<'de> for GetCredentialSettingsResponse {
    #[allow(deprecated)]
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        const FIELDS: &[&str] = &[
            "has_password",
            "hasPassword",
            "mfa_enabled",
            "mfaEnabled",
            "login_apple_id",
            "loginAppleId",
            "login_google_id",
            "loginGoogleId",
        ];

        #[allow(clippy::enum_variant_names)]
        enum GeneratedField {
            HasPassword,
            MfaEnabled,
            LoginAppleId,
            LoginGoogleId,
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
                            "hasPassword" | "has_password" => Ok(GeneratedField::HasPassword),
                            "mfaEnabled" | "mfa_enabled" => Ok(GeneratedField::MfaEnabled),
                            "loginAppleId" | "login_apple_id" => Ok(GeneratedField::LoginAppleId),
                            "loginGoogleId" | "login_google_id" => Ok(GeneratedField::LoginGoogleId),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }
                deserializer.deserialize_identifier(GeneratedVisitor)
            }
        }
        struct GeneratedVisitor;
        impl<'de> serde::de::Visitor<'de> for GeneratedVisitor {
            type Value = GetCredentialSettingsResponse;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("struct credential_settings_def.v1.GetCredentialSettingsResponse")
            }

            fn visit_map<V>(self, mut map: V) -> std::result::Result<GetCredentialSettingsResponse, V::Error>
                where
                    V: serde::de::MapAccess<'de>,
            {
                let mut has_password__ = None;
                let mut mfa_enabled__ = None;
                let mut login_apple_id__ = None;
                let mut login_google_id__ = None;
                while let Some(k) = map.next_key()? {
                    match k {
                        GeneratedField::HasPassword => {
                            if has_password__.is_some() {
                                return Err(serde::de::Error::duplicate_field("hasPassword"));
                            }
                            has_password__ = Some(map.next_value()?);
                        }
                        GeneratedField::MfaEnabled => {
                            if mfa_enabled__.is_some() {
                                return Err(serde::de::Error::duplicate_field("mfaEnabled"));
                            }
                            mfa_enabled__ = Some(map.next_value()?);
                        }
                        GeneratedField::LoginAppleId => {
                            if login_apple_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("loginAppleId"));
                            }
                            login_apple_id__ = map.next_value()?;
                        }
                        GeneratedField::LoginGoogleId => {
                            if login_google_id__.is_some() {
                                return Err(serde::de::Error::duplicate_field("loginGoogleId"));
                            }
                            login_google_id__ = map.next_value()?;
                        }
                    }
                }
                Ok(GetCredentialSettingsResponse {
                    has_password: has_password__.unwrap_or_default(),
                    mfa_enabled: mfa_enabled__.unwrap_or_default(),
                    login_apple_id: login_apple_id__,
                    login_google_id: login_google_id__,
                })
            }
        }
        deserializer.deserialize_struct("credential_settings_def.v1.GetCredentialSettingsResponse", FIELDS, GeneratedVisitor)
    }
}
