use maxminddb::{
    geoip2,
    Reader,
};
use std::net::IpAddr;

/// Parses and return the client's country code in ISO 3166-1 alpha-2 format using the information
/// from client's IP address.
///
/// * `ip` - The IP address of the client.
/// * `reader` - The geo-ip database reader instance.
pub fn get_client_country(ip: IpAddr, reader: &Reader<Vec<u8>>) -> Option<String> {
    let lookup_result = reader.lookup::<geoip2::City>(ip).ok()?;
    Some(lookup_result.country?.iso_code?.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::Ipv4Addr;

    /// Returns the geo database instance
    fn get_geo_db() -> Reader<Vec<u8>> {
        maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap()
    }

    #[test]
    fn can_return_valid_client_country_code() {
        let result = get_client_country(IpAddr::V4(Ipv4Addr::new(8, 8, 8, 8)), &get_geo_db());
        assert_eq!(result.unwrap(), "US".to_string());
    }

    #[test]
    fn can_handle_invalid_ip_address() {
        let result = get_client_country(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), &get_geo_db());
        assert!(result.is_none());
    }
}
