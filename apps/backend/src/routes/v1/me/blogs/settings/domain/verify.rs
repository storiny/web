use crate::{
    config::Config,
    constants::{
        blog_domain_regex::BLOG_DOMAIN_REGEX,
        domain_verification_key::DOMAIN_VERIFICATION_TXT_RECORD_KEY,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
    HmacSha1,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use hex::encode as encode_hex;
use hickory_resolver::{
    config::{
        ResolverConfig,
        ResolverOpts,
    },
    TokioAsyncResolver,
};
use hmac::Mac;
use lazy_static::lazy_static;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    Pool,
    Postgres,
    Row,
};
use std::ops::Deref;
use validator::Validate;

lazy_static! {
    static ref RESOLVER: TokioAsyncResolver =
        TokioAsyncResolver::tokio(ResolverConfig::default(), ResolverOpts::default());
}

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "BLOG_DOMAIN_REGEX")]
    #[validate(length(min = 3, max = 512, message = "Invalid domain length"))]
    domain: String,
}

/// Incoming request handler.
///
/// * `config` - The app configuration.
/// * `db_pool` - The Postgres connection pool.
/// * `user_id` - The ID of the current user.
/// * `blog_id` - The ID of the blog.
/// * `domain` - The target domain hostname.
/// * `resolver` - The optinal DNS resolver.
async fn handle_request(
    config: &Config,
    db_pool: &Pool<Postgres>,
    user_id: &i64,
    blog_id: &i64,
    domain: &str,
    resolver: Option<&TokioAsyncResolver>,
) -> Result<HttpResponse, AppError> {
    let mut txn = db_pool.begin().await?;

    // Check blog and permissions.
    let result = sqlx::query(
        r#"
WITH domain_check AS (
    SELECT EXISTS (
        SELECT FROM blogs
        WHERE
            domain = $3
            AND id <> $2
    ) AS "found"
), redundant_check AS (
    SELECT EXISTS (
        SELECT FROM blogs
        WHERE
            id = $2
            AND domain IS NOT NULL
    ) AS "redundant"
)
SELECT
	(SELECT "found" FROM domain_check),
	(SELECT "redundant" FROM redundant_check)
FROM blogs
WHERE
    id = $2
    AND user_id = $1
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .bind(domain)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(None, "Unknown blog"))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    // Check for duplicate domain.
    if result.get::<bool, _>("found") {
        return Err(AppError::FormError(FormErrorResponse::new(
            None,
            vec![("domain", "This domain is already connected to another blog")],
        )));
    }

    // Check for redundant domain.
    if result.get::<bool, _>("redundant") {
        return Err(AppError::ToastError(ToastErrorResponse::new(
            None,
            "This blog already has a domain connected to it",
        )));
    }

    let txt_record_content = {
        let secret = &config.domain_verification_secret;
        let mut mac = HmacSha1::new_from_slice(secret.as_bytes())
            .map_err(|error| AppError::InternalError(error.to_string()))?;
        let fragment = format!("{domain}:{blog_id}");

        mac.update(fragment.as_bytes());

        let result = mac.finalize();

        format!(
            "{}={}",
            DOMAIN_VERIFICATION_TXT_RECORD_KEY,
            encode_hex(result.into_bytes())
        )
    };

    let resolver = resolver.unwrap_or(RESOLVER.deref());
    let query = format!("_storiny.{domain}");
    let txt_records = resolver.txt_lookup(query.as_str()).await.map_err(|_| {
        AppError::ToastError(ToastErrorResponse::new(
            None,
            "The domain's host could not be resolved",
        ))
    })?;

    if !txt_records
        .iter()
        .any(|record| record.to_string() == txt_record_content)
    {
        return Err(ToastErrorResponse::new(
            None,
            "No valid TXT record was found at the domain's host",
        )
        .into());
    }

    // Update domain
    match sqlx::query(
        r#"
UPDATE blogs
SET domain = $1
WHERE
   id = $2
"#,
    )
    .bind(domain)
    .bind(blog_id)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::InternalError("blog not found".to_string())),
        _ => {
            txn.commit().await?;
            Ok(HttpResponse::NoContent().finish())
        }
    }
}

#[post("/v1/me/blogs/{blog_id}/settings/domain")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/settings/domain",
    skip_all,
    fields(
        user = user.id().ok(),
        blog_id = %path.blog_id,
        payload
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    handle_request(
        &data.config,
        &data.db_pool,
        &user_id,
        &blog_id,
        &payload.domain,
        None,
    )
    .await
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        config::get_app_config,
        test_utils::{
            assert_form_error_response,
            assert_toast_error_response,
            init_app_for_test,
        },
    };
    use actix_web::test;
    use async_trait::async_trait;
    use hashbrown::HashMap;
    use hickory_resolver::config::{
        NameServerConfig,
        Protocol,
    };
    use hickory_server::{
        authority::MessageResponseBuilder,
        proto::{
            error::ProtoError,
            op::{
                Header,
                ResponseCode,
            },
            rr::{
                rdata::{
                    A,
                    AAAA,
                    TXT,
                },
                LowerName,
                RData,
                Record,
            },
        },
        server::{
            RequestHandler,
            ResponseHandler,
            ResponseInfo,
        },
        ServerFuture,
    };
    use sqlx::{
        testing::TestTermination,
        PgPool,
    };
    use std::{
        net::{
            IpAddr,
            Ipv4Addr,
            SocketAddr,
            SocketAddrV4,
        },
        str::FromStr,
    };
    use tokio::net::UdpSocket;

    /// The type of the DNS record.
    #[derive(Debug, Clone)]
    pub enum DNSRecord {
        /// An IPv4 or IPv6 address record.
        Ip(IpAddr),
        /// A plain TXT record.
        Txt(Vec<String>),
    }

    /// A simple mock server for DNS requests.
    ///
    /// The intended usage is to create a new instance using [`Server::default()`] and add some
    /// record mappings to it. A [`UdpSocket`] can then be bined to start the server with
    /// [`Server::start()`] in a background task before making requests on the main thread.
    #[derive(Clone, Debug, Default)]
    pub struct Server {
        store: HashMap<LowerName, Vec<DNSRecord>>,
    }

    impl Server {
        /// Adds a mapping from a DNS record to some IP addresses.
        ///
        /// * `name` - The host name.
        /// * `records` - The DNS records.
        pub fn add_records(
            &mut self,
            name: &str,
            records: Vec<DNSRecord>,
        ) -> Result<(), ProtoError> {
            let name = LowerName::from_str(name)?;
            self.store.insert(name, records);
            Ok(())
        }

        /// Starts the mock server on the given [`UdpSocket`].
        ///
        /// This should be run in a background task using a method such as [`tokio::spawn`].
        ///
        /// * `socket` - The socket to run the server at.
        pub async fn start(self, socket: UdpSocket) -> Result<(), ProtoError> {
            let mut server = ServerFuture::new(self);

            server.register_socket(socket);
            server.block_until_done().await?;

            Ok(())
        }
    }

    #[async_trait]
    impl RequestHandler for Server {
        async fn handle_request<R>(
            &self,
            request: &hickory_server::server::Request,
            mut response_handler: R,
        ) -> ResponseInfo
        where
            R: ResponseHandler,
        {
            let builder = MessageResponseBuilder::from_message_request(request);

            let mut header = Header::response_from_request(request.header());
            header.set_authoritative(true);

            let name = request.query().name();

            if let Some(entries) = self.store.get(name) {
                let records: Vec<_> = entries
                    .iter()
                    .map(|entry| match entry {
                        DNSRecord::Ip(ip) => match ip {
                            IpAddr::V4(ipv4) => RData::A(A::from(*ipv4)),
                            IpAddr::V6(ipv6) => RData::AAAA(AAAA::from(*ipv6)),
                        },
                        DNSRecord::Txt(content) => RData::TXT(TXT::new(content.clone())),
                    })
                    .map(|rdata| Record::from_rdata(name.into(), 60, rdata))
                    .collect();

                let response = builder.build(header, records.iter(), &[], &[], &[]);
                response_handler.send_response(response).await.unwrap()
            } else {
                header.set_response_code(ResponseCode::ServFail);
                let response = builder.build_no_records(header);
                response_handler.send_response(response).await.unwrap()
            }
        }
    }

    /// Starts the DNS mock server for tests. Adds a default `_storiny.test.com` host.
    ///
    /// * `txt_record` - The domain verification TXT record value.
    async fn start_dns_mock_server(txt_record: String) -> SocketAddr {
        let mut server = Server::default();

        server
            .add_records(
                "_storiny.test.com",
                vec![
                    DNSRecord::Ip(IpAddr::V4(Ipv4Addr::LOCALHOST)),
                    DNSRecord::Txt(vec![txt_record]),
                ],
            )
            .expect("unable to add mapping");

        let addr = SocketAddrV4::new(Ipv4Addr::LOCALHOST, 0);
        let socket = UdpSocket::bind(&addr).await.expect("binding failed");
        let local_addr = socket.local_addr().unwrap();

        tokio::spawn(async move {
            server.start(socket).await.unwrap();
        });

        local_addr
    }

    #[sqlx::test]
    async fn can_verify_domain_ownership(pool: PgPool) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let mut conn = pool.acquire().await?;
        let (_, _, user_id) = init_app_for_test(post, pool.clone(), true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");
        let txt_record_content = {
            let secret = &config.domain_verification_secret;
            let mut mac = HmacSha1::new_from_slice(secret.as_bytes()).unwrap();
            let fragment = format!("{}:{blog_id}", "test.com");

            mac.update(fragment.as_bytes());

            let result = mac.finalize();

            format!(
                "{DOMAIN_VERIFICATION_TXT_RECORD_KEY}={}",
                encode_hex(result.into_bytes())
            )
        };
        let mock_server_addr = start_dns_mock_server(txt_record_content).await;

        let result = handle_request(
            &config,
            &pool,
            &user_id.unwrap(),
            &blog_id,
            "test.com",
            Some({
                let mut config = ResolverConfig::new();
                let nameserver_config = NameServerConfig::new(mock_server_addr, Protocol::Udp);
                config.add_name_server(nameserver_config);

                &TokioAsyncResolver::tokio(config, ResolverOpts::default())
            }),
        )
        .await;

        assert!(result.is_success());

        // Should update the blog in database.
        let result = sqlx::query(
            r#"
SELECT domain
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<Option<String>, _>("domain"),
            Some("test.com".to_string())
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_domain_verification_request_for_an_invalid_txt_record(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let mut conn = pool.acquire().await?;
        let (_, _, user_id) = init_app_for_test(post, pool.clone(), true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");
        let txt_record_content = format!("{DOMAIN_VERIFICATION_TXT_RECORD_KEY}=1234");
        let mock_server_addr = start_dns_mock_server(txt_record_content).await;

        let error = handle_request(
            &config,
            &pool,
            &user_id.unwrap(),
            &blog_id,
            "test.com",
            Some({
                let mut config = ResolverConfig::new();
                let nameserver_config = NameServerConfig::new(mock_server_addr, Protocol::Udp);
                config.add_name_server(nameserver_config);

                &TokioAsyncResolver::tokio(config, ResolverOpts::default())
            }),
        )
        .await
        .unwrap_err();

        match error {
            AppError::ToastError(error) => assert_eq!(
                error.error,
                "No valid TXT record was found at the domain's host".to_string()
            ),
            _ => panic!("not a toast error"),
        };

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_domain_verification_request_for_a_missing_txt_record(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let mut conn = pool.acquire().await?;
        let (_, _, user_id) = init_app_for_test(post, pool.clone(), true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");
        let mock_server_addr = start_dns_mock_server("".to_string()).await;

        let error = handle_request(
            &config,
            &pool,
            &user_id.unwrap(),
            &blog_id,
            "test.com",
            Some({
                let mut config = ResolverConfig::new();
                let nameserver_config = NameServerConfig::new(mock_server_addr, Protocol::Udp);
                config.add_name_server(nameserver_config);

                &TokioAsyncResolver::tokio(config, ResolverOpts::default())
            }),
        )
        .await
        .unwrap_err();

        match error {
            AppError::ToastError(error) => assert_eq!(
                error.error,
                "No valid TXT record was found at the domain's host".to_string()
            ),
            _ => panic!("not a toast error"),
        };

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_domain_verification_request_for_an_unresolvable_host(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let mut conn = pool.acquire().await?;
        let (_, _, user_id) = init_app_for_test(post, pool.clone(), true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");
        let mock_server_addr = start_dns_mock_server("".to_string()).await;

        let error = handle_request(
            &config,
            &pool,
            &user_id.unwrap(),
            &blog_id,
            "invalid.com",
            Some({
                let mut config = ResolverConfig::new();
                let nameserver_config = NameServerConfig::new(mock_server_addr, Protocol::Udp);
                config.add_name_server(nameserver_config);

                &TokioAsyncResolver::tokio(config, ResolverOpts::default())
            }),
        )
        .await
        .unwrap_err();

        match error {
            AppError::ToastError(error) => assert_eq!(
                error.error,
                "The domain's host could not be resolved".to_string()
            ),
            _ => panic!("not a toast error"),
        };

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_domain_verification_request_for_a_deleted_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_domain_verification_request_for_a_duplicate_domain(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert blogs.
        let result = sqlx::query(
            r#"
WITH duplicate_blog AS (
    INSERT INTO blogs (name, slug, domain, user_id)
    VALUES ($1, $2, $3, $5)
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $4, $5)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("one".to_string())
        .bind("test.com".to_string())
        .bind("two".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![("domain", "This domain is already connected to another blog")],
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_domain_verification_request_for_a_redundant_domain(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a blog with domain.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, domain, user_id)
VALUES ($1, $2, $3, $4)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind("test.com".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "This blog already has a domain connected to it").await;

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_domain_verification_request_for_an_unknown_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_domain_verification_request_for_an_invalid_domain(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/settings/domain", 12345))
            .set_json(Request {
                domain: "12345678".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        Ok(())
    }
}
