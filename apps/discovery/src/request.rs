use lazy_static::lazy_static;

pub static USER_AGENT: &str = "storiny-bot/1.0";

lazy_static! {
    pub static ref REQUEST_CLIENT: reqwest::Client = reqwest::Client::new();
}
