use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    pub static ref TAG_REGEX: Regex = Regex::new(r"^[a-z0-9-]{1,32}$").unwrap();
}
