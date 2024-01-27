use crate::spec::Provider;
use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    pub static ref PROVIDERS: Vec<Provider> = {
        let json_data = include_bytes!("./providers.json");
        #[allow(clippy::expect_used)]
        let mut providers: Vec<Provider> =
            serde_json::from_slice(json_data).expect("failed to read providers from the JSON file");

        // Convert schemas to regex matchers for each provider.
        providers.iter_mut().for_each(|provider| {
            let regex_schemas: Vec<Regex> = provider
                .schemas
                .iter()
                .map(|schema| {
                    let regex_pattern = schema
                        .replace('.', "\\.")
                        .replace('*', "(.+)")
                        .replace('?', "\\?");
                    Regex::new(&regex_pattern).unwrap_or_else(|_| panic!("invalid regex pattern: {}", schema))
                })
                .collect();

            provider.matchers = regex_schemas;
        });

        providers
    };
}
