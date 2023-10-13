use crate::login_activity_def::v1::DeviceType;
use std::borrow::Cow;
use user_agent_parser::UserAgentParser;

/// Parses and return client's device information from the user-agent string.
///
/// * `ua` - User-agent string
/// * `parser` - User-agent parser instannce
pub fn get_device(ua: &str, parser: &UserAgentParser) -> (String, DeviceType) {
    let device = parser.parse_device(ua);
    let os = parser.parse_os(ua);
    let brand = device.clone().brand.unwrap_or_default();
    let mut device_type = DeviceType::Unknown;

    {
        match os.name.clone().unwrap_or_default().as_ref() {
            "Windows" | "Mac OS" | "Chrome OS" | "CentOS" | "AmigaOS" | "Ubuntu" | "Arch"
            | "Debian" | "Unix" | "Linux" | "Raspbian" | "VectorLinux" | "Solaris" => {
                device_type = DeviceType::Computer;
            }
            "Android" | "iOS" | "Windows Phone" => {
                device_type = DeviceType::Mobile;
            }
            _ => {}
        }

        match device.model.clone().unwrap_or_default().as_ref() {
            "iPad" => device_type = DeviceType::Tablet,
            "Mac" => device_type = DeviceType::Computer,
            _ => {}
        }

        match brand.as_ref() {
            "Generic_Android" => device_type = DeviceType::Mobile,
            "Generic_Android_Tablet" => device_type = DeviceType::Tablet,
            _ => {}
        }
    }

    if device.brand.is_some() && device.model.is_some() {
        return (
            format!(
                "{} {}",
                if &brand == "Generic_Android" {
                    "Android".to_string()
                } else if &brand == "Generic_Android_Tablet" {
                    "Android Tablet".to_string()
                } else {
                    brand.to_string()
                },
                device.model.unwrap_or_default(),
            ),
            device_type,
        );
    }

    let os_name = os.name.unwrap_or(Cow::from("Unknown device")).to_string();

    (
        if os_name == "Other" {
            "Unknown device".to_string()
        } else {
            os_name
        },
        device_type,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Returns the user agent parser instance
    fn get_ua_parser() -> UserAgentParser {
        UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
            .expect("Cannot build user-agent parser")
    }

    #[test]
    fn can_return_device_information_for_a_windows_desktop() {
        let result = get_device(
            "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko",
            &get_ua_parser(),
        );

        assert_eq!(result.0, "Windows");
        assert_eq!(result.1, DeviceType::Computer);
    }

    #[test]
    fn can_return_device_information_for_a_mac() {
        let result = get_device(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:40.0) Gecko/20100101 Firefox/40.0",
            &get_ua_parser(),
        );

        assert_eq!(result.0, "Apple Mac");
        assert_eq!(result.1, DeviceType::Computer);
    }

    #[test]
    fn can_return_device_information_for_an_ubuntu_desktop() {
        let result = get_device(
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:40.0) Gecko/20100101 Firefox/40.0",
            &get_ua_parser(),
        );

        assert_eq!(result.0, "Ubuntu");
        assert_eq!(result.1, DeviceType::Computer);
    }

    #[test]
    fn can_return_device_information_for_an_android_smartphone() {
        let result = get_device(
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36",
            &get_ua_parser(),
        );

        assert_eq!(result.0, "Generic Smartphone");
        assert_eq!(result.1, DeviceType::Mobile);
    }

    #[test]
    fn can_return_device_information_for_an_iphone() {
        let result = get_device(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53",
            &get_ua_parser(),
        );

        assert_eq!(result.0, "Apple iPhone");
        assert_eq!(result.1, DeviceType::Mobile);
    }

    #[test]
    fn can_return_device_information_for_an_ipad() {
        let result = get_device(
            "Mozilla/5.0 (iPad; CPU OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            &get_ua_parser(),
        );

        assert_eq!(result.0, "Apple iPad");
        assert_eq!(result.1, DeviceType::Tablet);
    }

    #[test]
    fn can_handle_unknown_devices() {
        let result = get_device("Invalid UA", &get_ua_parser());
        assert_eq!(result.0, "Unknown device");
        assert_eq!(result.1, DeviceType::Unknown);
    }
}
