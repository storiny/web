use serde::{
    de,
    Deserialize,
    Deserializer,
    Serializer,
};
use std::fmt;

/// Snowflake ID serializer and deserializer. This enables the deserialization of Snowflake IDs
/// from an integer or string value, as well as the serialization of Snowflake IDs into a
/// string value to prevent the big-int values from losing precision when they are sent to the
/// client.

#[derive(Deserialize)]
#[serde(untagged)]
enum StringOrInt {
    String(String),
    Int(i64),
}

pub fn serialize<T, S>(value: &T, serializer: S) -> Result<S::Ok, S::Error>
where
    T: fmt::Display,
    S: Serializer,
{
    serializer.collect_str(value)
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: Deserializer<'de>,
{
    match StringOrInt::deserialize(deserializer)? {
        StringOrInt::String(val) => val.parse().map_err(de::Error::custom),
        StringOrInt::Int(int) => Ok(int),
    }
}

pub mod option {
    use serde::{
        de,
        Deserialize,
        Deserializer,
        Serializer,
    };
    use std::fmt;

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StringOrIntOrNull {
        String(String),
        Int(i64),
        None,
    }

    pub fn serialize<T, S>(value: &Option<T>, serializer: S) -> Result<S::Ok, S::Error>
    where
        T: fmt::Display,
        S: Serializer,
    {
        match value {
            Some(value) => serializer.collect_str(value),
            None => serializer.serialize_none(),
        }
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<i64>, D::Error>
    where
        D: Deserializer<'de>,
    {
        match StringOrIntOrNull::deserialize(deserializer)? {
            StringOrIntOrNull::String(val) => {
                let parsed: Result<i64, _> = val.parse().map_err(de::Error::custom);
                match parsed {
                    Ok(value) => Ok(Some(value)),
                    Err(error) => Err(error),
                }
            }
            StringOrIntOrNull::Int(int) => Ok(Some(int)),
            StringOrIntOrNull::None => Ok(None),
        }
    }
}
