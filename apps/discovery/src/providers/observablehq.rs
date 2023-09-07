use super::Provider;
use lazy_regex::regex;

/// ObservableHQ embed provider
pub static OBSERVABLEHQ_PROVIDER: Provider = Provider {
    name: "ObservableHQ",
    endpoint: "api.observablehq.com/oembed",
    padding: None,
    schemas: &[
        regex!("observablehq\\.com/@(.*)/(.*)"),
        regex!("observablehq\\.com/d/(.*)"),
        regex!("observablehq\\.com/embed/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
