use maxminddb::{
    geoip2,
    Reader,
};
use serde::{
    Deserialize,
    Serialize,
};
use std::net::IpAddr;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClientLocation {
    pub display_name: String,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
}

/// Parses and return the client's location information from the client's IP address.
///
/// * `ip` - The IP address of the client.
/// * `reader` - The geo-ip database reader instance.
pub fn get_client_location(ip: IpAddr, reader: &Reader<Vec<u8>>) -> Option<ClientLocation> {
    let result = reader.lookup::<geoip2::City>(ip).ok()?;

    let mut city_name: Option<String> = None;
    let mut country_name: Option<String> = None;
    let mut lat: Option<f64> = None;
    let mut lng: Option<f64> = None;
    let display_name: String;

    if let Some(city) = &result.city {
        if let Some(city_names) = &city.names {
            if let Some(en_name) = city_names.get("en") {
                city_name = Some(en_name.to_owned().to_string());
            }
        }
    }

    if let Some(country) = &result.country {
        if let Some(country_names) = &country.names {
            if let Some(en_name) = country_names.get("en") {
                country_name = Some(en_name.to_owned().to_string());
            }
        }
    }

    if let Some(location) = &result.location {
        lat = location.latitude;
        lng = location.longitude;
    }

    if city_name.is_some() {
        if country_name.is_some() {
            display_name = format!(
                "{}, {}",
                city_name.unwrap_or_default(),
                country_name.unwrap_or_default()
            );
        } else {
            display_name = city_name.unwrap_or_default();
        }
    } else if country_name.is_some() {
        display_name = country_name.unwrap_or_default()
    } else {
        display_name = "Unknown location".to_string()
    }

    Some(ClientLocation {
        display_name,
        lat,
        lng,
    })
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
    fn can_return_valid_client_location_information() {
        let result =
            get_client_location(IpAddr::V4(Ipv4Addr::new(8, 8, 8, 8)), &get_geo_db()).unwrap();

        assert_eq!(result.display_name, "United States".to_string());
        assert!(result.lat.is_some());
        assert!(result.lng.is_some());
    }

    #[test]
    fn can_handle_invalid_ip_address() {
        let result = get_client_location(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), &get_geo_db());
        assert!(result.is_none());
    }
}
