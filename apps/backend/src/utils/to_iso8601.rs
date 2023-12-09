use time::{
    format_description::well_known::{
        iso8601::{
            Config,
            EncodedConfig,
        },
        Iso8601,
    },
    OffsetDateTime,
};

/// The configuration of ISO 8601.
const SERDE_CONFIG: EncodedConfig = Config::DEFAULT.set_year_is_six_digits(false).encode();

/// Serializes an [OffsetDateTime] using the well-known [ISO 8601 format].
///
/// * `datetime` - The [OffsetDateTime] value.
///
/// [ISO 8601 format]: https://www.iso.org/iso-8601-date-and-time-format.html
pub fn to_iso8601(datetime: &OffsetDateTime) -> String {
    datetime
        .format(&Iso8601::<SERDE_CONFIG>)
        .unwrap_or(datetime.to_string())
}
