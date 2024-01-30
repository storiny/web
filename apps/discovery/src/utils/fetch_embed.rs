use crate::{
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

impl Client {
    /// Creates a new request client.
    ///
    /// * `client` - The [reqwest::Client] client instance.
    pub fn new(client: reqwest::Client) -> Self {
        Self(client)
    }

    /// Fetches the oembed data from the endpoint of the provider.
    ///
    /// * `endpoint` - The provider endpoint.
    /// * `request` - The consumer request data.
    pub async fn fetch(
        &self,
        endpoint: &str,
        request: ConsumerRequest<'_>,
    ) -> Result<EmbedResponse, AppError> {
        let mut url = Url::parse(endpoint)?;

        {
            let mut query_map: HashMap<String, String> = HashMap::new();

            url.query_pairs_mut().clear();

            url.query_pairs_mut().append_pair("url", request.url);
            url.query_pairs_mut().append_pair("format", "json");

            // Custom parameters.
            if let Some(params) = request.params {
                let primitive_keys = ["url", "format", "access_token"];

                let params_not_in_request = url
                    .query_pairs()
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

            url.query_pairs_mut().extend_pairs(query_map).finish();
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
/// * `endpoint` - The provider oEmbed endpoint.
/// * `request` - The consumer request data.
pub async fn fetch_embed(
    endpoint: &str,
    request: ConsumerRequest<'_>,
) -> Result<EmbedResponse, AppError> {
    Client::new(REQUEST_CLIENT.clone())
        .fetch(endpoint, request)
        .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::Server;
    use urlencoding::encode;

    #[tokio::test]
    async fn can_fetch_embed() {
        let mut server = Server::new_async().await;
        let url = server.url();

        let mock = server
            .mock(
                "GET",
                format!("/?url={}&format=json", encode("http://example.com")).as_str(),
            )
            .with_status(200)
            .with_body(r#"{"type": "link"}"#)
            .with_header("content-type", "application/json")
            .create_async()
            .await;

        let result = fetch_embed(
            &url,
            ConsumerRequest {
                url: "http://example.com",
                ..Default::default()
            },
        )
        .await;

        assert_eq!(
            result.unwrap(),
            EmbedResponse {
                oembed_type: crate::spec::EmbedType::Link,
                title: None,
                extra: HashMap::default(),
            }
        );

        mock.assert_async().await;
    }

    #[tokio::test]
    async fn can_throw_fetch_error() {
        let mut server = Server::new_async().await;
        let url = server.url();

        let mock = server
            .mock(
                "GET",
                format!("/?url={}&format=json", encode("http://example.com")).as_str(),
            )
            .with_status(404)
            .create_async()
            .await;

        let result = fetch_embed(
            &url,
            ConsumerRequest {
                url: "http://example.com",
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
