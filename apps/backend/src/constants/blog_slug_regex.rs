use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    pub static ref BLOG_SLUG_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^[\w_-]+$").unwrap()
    };
}
