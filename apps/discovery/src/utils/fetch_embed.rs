use crate::{
    error::Error,
    request::{
        REQUEST_CLIENT,
        USER_AGENT,
    },
    spec::EmbedResponse,
};
use hashbrown::HashMap;
use reqwest::header;
use std::env;
use url::Url;

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

/// Returns the Facebook graph token.
fn get_facebook_graph_token() -> String {
    format!(
        "{}|{}",
        env::var("OAUTH_FACEBOOK_CLIENT_ID").expect("Facebook client ID is not set"),
        env::var("OAUTH_FACEBOOK_CLIENT_SECRET").expect("Facebook client secret is not set")
    )
}

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
            let mut query = url.query_pairs_mut();

            query.append_pair("url", request.url);
            query.append_pair("format", "json");

            // Append Facebook access token
            if is_facebook_graph_dependent(&endpoint.to_string()) {
                query.append_pair("access_token", &get_facebook_graph_token());
            }

            // Append custom params
            if let Some(params) = request.params {
                for (key, value) in params {
                    query.append_pair(key, value);
                }
            }

            query.finish();
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
