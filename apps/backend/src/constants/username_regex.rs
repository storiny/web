use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    pub static ref USERNAME_REGEX: Regex = Regex::new(r"^[\w_]+$").unwrap();
}
