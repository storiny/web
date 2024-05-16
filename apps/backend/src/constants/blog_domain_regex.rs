use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    pub static ref BLOG_DOMAIN_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,24}$").unwrap()
    };
}
