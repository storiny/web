use crate::constants::session_cookie::SESSION_COOKIE_NAME;
use cookie::{
    CookieJar,
    Key,
};
use urlencoding::decode;

/// Cookie value digest length.
const BASE64_DIGEST_LEN: usize = 44;

/// Examines the session cookie and tries to extract the session key.
///
/// Returns `None` if the session cookie is considered invalid (when failing a signature check).
///
/// * `cookie_value` - The value of the cookie.
/// * `key` - The secret key used to sign the cookie.
pub fn extract_session_key_from_cookie(cookie_value: &str, key: &Key) -> Option<String> {
    let mut jar = CookieJar::new();
    jar.signed_mut(key)
        .add_original((SESSION_COOKIE_NAME, cookie_value.to_owned()));
    let result = jar.signed(key).get(SESSION_COOKIE_NAME);
    let value_str = result?.value().to_string();
    let cookie_value = decode(&value_str).ok()?;

    if cookie_value.chars().count() <= BASE64_DIGEST_LEN {
        return None;
    }

    Some(cookie_value.split_at(BASE64_DIGEST_LEN).1.to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;
    use cookie::Cookie;
    use uuid::Uuid;

    #[test]
    fn can_extract_session_key_from_cookie() {
        let session_key = Uuid::new_v4().to_string();
        let secret_key = Key::generate();
        let cookie = Cookie::new(SESSION_COOKIE_NAME, session_key.clone());
        let mut jar = CookieJar::new();

        jar.signed_mut(&secret_key).add(cookie);

        let cookie = jar.delta().next().unwrap();
        let result = extract_session_key_from_cookie(cookie.value(), &secret_key);

        assert_eq!(result.unwrap(), session_key);
    }
}
