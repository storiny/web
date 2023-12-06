use crate::{
    config::Config,
    error::AppError,
    request::{
        REQUEST_CLIENT,
        USER_AGENT,
    },
    spec::EmbedResponse,
};
use hashbrown::HashMap;
use reqwest::header;
use url::Url;

/// The request for fetching the oembed data.
///
/// See the [oembed specification](https://oembed.com/#section2.2)
#[derive(Debug, Default)]
pub struct ConsumerRequest<'a> {
    /// The URL provided by the client.
    pub url: &'a str,
    /// The additional parameters for the request.
    pub params: Option<HashMap<&'a str, &'a str>>,
}

/// The oEmbed client.
#[derive(Debug, Clone)]
pub struct Client(reqwest::Client);

/// Predicate function for determining endpoints that depend on the Facebook graph API, thus
/// requiring a Facebook graph token to work.
///
/// * `endpoint` - The embed endpoint.
fn is_facebook_graph_dependent(endpoint: &str) -> bool {
    endpoint.starts_with("https://graph.facebook.com")
}

impl Client {
    /// Creates a new request client.
    ///
    /// * `client` - The [reqwest::Client] client instance.
    pub fn new(client: reqwest::Client) -> Self {
        Self(client)
    }

    /// Fetches the oembed data from the endpoint of the provider.
    ///
    /// * `config` - The environment configuration.
    /// * `endpoint` - The provider endpoint.
    /// * `request` - The consumer request data.
    pub async fn fetch(
        &self,
        config: &Config,
        endpoint: &str,
        request: ConsumerRequest<'_>,
    ) -> Result<EmbedResponse, AppError> {
        let mut url = Url::parse(endpoint)?;

        {
            let mut query_map: HashMap<String, String> = HashMap::new();

            query_map.insert("url".to_string(), request.url.to_string());
            query_map.insert("format".to_string(), "json".to_string());

            // Append Facebook client ID and access token.
            if is_facebook_graph_dependent(&endpoint.to_string()) {
                query_map.insert(
                    "access_token".to_string(),
                    format!(
                        "{}|{}",
                        config.oauth_facebook_client_id, config.oauth_facebook_client_secret
                    ),
                );
            }

            // Custom parameters.
            if let Some(params) = request.params {
                let primitive_keys = vec!["url", "format", "access_token"];

                let params_not_in_request = url
                    .query_pairs()
                    .clone()
                    .into_iter()
                    .filter(|(key, _)| {
                        let cloned_key = key.clone();
                        !params.contains_key(cloned_key.as_ref())
                            && !primitive_keys.contains(&cloned_key.as_ref())
                    })
                    .collect::<HashMap<_, _>>();

                for (key, value) in params_not_in_request {
                    query_map.insert(key.to_string(), value.to_string());
                }

                for (key, value) in params {
                    query_map.insert(key.to_string(), value.to_string());
                }
            }

            url.query_pairs_mut()
                .clear()
                .extend_pairs(query_map)
                .finish();
        }

        Ok(self
            .0
            .get(url)
            .header(header::USER_AGENT, USER_AGENT)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await
            .map(|mut response: EmbedResponse| {
                // Remove the `type` field from the extra fields as we use #[serde(flatten)] twice.
                response.extra.remove("type");
                response
            })?)
    }
}

/// Fetches oembed data from the endpoint of the provider.
///
/// * `config` - The environment configuration.
/// * `endpoint` - The provider oEmbed endpoint.
/// * `request` - The consumer request data.
pub async fn fetch_embed(
    config: &Config,
    endpoint: &str,
    request: ConsumerRequest<'_>,
) -> Result<EmbedResponse, AppError> {
    Client::new(REQUEST_CLIENT.clone())
        .fetch(config, endpoint, request)
        .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::get_app_config;
    use mockito::Server;

    #[tokio::test]
    async fn can_fetch_embed() {
        let mut server = Server::new_async().await;
        let config = get_app_config().unwrap();

        let mock = server
            .mock("GET", "/?url=https%3A%2F%2Fexample.com&format=json")
            .with_status(200)
            .with_body(r#"{"type": "link"}"#)
            .with_header("content-type", "application/json")
            .create_async()
            .await;

        let result = fetch_embed(
            &config,
            &server.url(),
            ConsumerRequest {
                url: "https://example.com",
                ..ConsumerRequest::default()
            },
        )
        .await;

        assert_eq!(
            result.ok(),
            Some(EmbedResponse {
                oembed_type: crate::spec::EmbedType::Link,
                title: None,
                extra: HashMap::default(),
            })
        );

        mock.assert_async().await;
    }

    #[tokio::test]
    async fn can_throw_fetch_error() {
        let mut server = Server::new_async().await;
        let config = get_app_config().unwrap();

        let mock = server
            .mock("GET", "/?url=https%3A%2F%2Fexample.com&format=json")
            .with_status(404)
            .create_async()
            .await;

        let result = fetch_embed(
            &config,
            &server.url(),
            ConsumerRequest {
                url: "https://example.com",
                ..Default::default()
            },
        )
        .await;

        if let Err(AppError::ReqwestError(error)) = result {
            assert_eq!(error.status(), Some(reqwest::StatusCode::NOT_FOUND))
        } else {
            panic!("Unexpected result: {:?}", result);
        }

        mock.assert_async().await;
    }
}
