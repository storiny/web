use crate::{
    error::Error,
    request::{
        REQUEST_CLIENT,
        USER_AGENT,
    },
    spec::EmbedResponse,
};
use dotenv;
use hashbrown::HashMap;
use lazy_static::lazy_static;
use reqwest::header;
use url::Url;

lazy_static! {
    static ref FB_GRAPH_TOKEN: String = format!(
        "{}|{}",
        dotenv::var("OAUTH_FACEBOOK_CLIENT_ID").expect("Facebook client ID is not set"),
        dotenv::var("OAUTH_FACEBOOK_CLIENT_SECRET",).expect("Facebook client secret is not set")
    );
}

/// Request for fetching the oembed data.
/// See the [oembed specification](https://oembed.com/#section2.2)
#[derive(Default)]
pub struct ConsumerRequest<'a> {
    /// URL provided by the client
    pub url: &'a str,
    /// Additional params for the request
    pub params: Option<HashMap<&'a str, &'a str>>,
}

/// oEmbed client
#[derive(Clone)]
pub struct Client(reqwest::Client);

/// Predicate function for determining endpoints that depend on the Facebook graph API, thus
/// requiring a Facebook graph token to work.
///
/// * `endpoint` - Embed endpoint
fn is_facebook_graph_dependent(endpoint: &str) -> bool {
    endpoint.starts_with("https://graph.facebook.com")
}

impl Client {
    /// Create a new request client
    pub fn new(client: reqwest::Client) -> Self {
        Self(client)
    }

    /// Fetches oembed data from the endpoint of a provider
    pub async fn fetch(
        &self,
        endpoint: &str,
        request: ConsumerRequest<'_>,
    ) -> Result<EmbedResponse, Error> {
        let mut url = Url::parse(endpoint)?;

        {
            let mut query_map: HashMap<String, String> = HashMap::new();

            query_map.insert("url".to_string(), request.url.to_string());
            query_map.insert("format".to_string(), "json".to_string());

            // Append Facebook access token
            if is_facebook_graph_dependent(&endpoint.to_string()) {
                query_map.insert("access_token".to_string(), FB_GRAPH_TOKEN.to_string());
            }

            // Append custom params
            if let Some(params) = request.params {
                let primitive_keys = vec!["url", "format", "access_token"];

                // Filter request params
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
                // Remove the `type` field from the extra fields as we use #[serde(flatten)] twice
                response.extra.remove("type");
                response
            })?)
    }
}

/// Fetches oembed data from the endpoint of a provider
///
/// * `endpoint` - Provider oEmbed endpoint
/// * `request` - Client request data
pub async fn fetch_embed(
    endpoint: &str,
    request: ConsumerRequest<'_>,
) -> Result<EmbedResponse, Error> {
    Client::new(REQUEST_CLIENT.clone())
        .fetch(endpoint, request)
        .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::Server;

    #[actix_web::test]
    async fn can_fetch_embed() {
        let mut server = Server::new_async().await;

        let mock = server
            .mock("GET", "/?url=https%3A%2F%2Fexample.com&format=json")
            .with_status(200)
            .with_body(r#"{"version": "1.0", "type": "link"}"#)
            .with_header("content-type", "application/json")
            .create_async()
            .await;

        let result = fetch_embed(
            &server.url().as_str(),
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
                version: "1.0".to_string(),
                title: None,
                author_name: None,
                author_url: None,
                provider_name: None,
                provider_url: None,
                thumbnail_url: None,
                thumbnail_width: None,
                thumbnail_height: None,
                extra: HashMap::default(),
            })
        );

        mock.assert_async().await;
    }

    #[actix_web::test]
    async fn test_fetch_error() {
        let mut server = Server::new_async().await;

        let mock = server
            .mock("GET", "/?url=https%3A%2F%2Fexample.com&format=json")
            .with_status(404)
            .create_async()
            .await;

        let result = fetch_embed(
            &server.url().as_str(),
            ConsumerRequest {
                url: "https://example.com",
                ..ConsumerRequest::default()
            },
        )
        .await;

        if let Err(Error::Reqwest(err)) = result {
            assert_eq!(err.status(), Some(reqwest::StatusCode::NOT_FOUND))
        } else {
            panic!("Unexpected result: {:?}", result);
        }

        mock.assert_async().await;
    }
}
