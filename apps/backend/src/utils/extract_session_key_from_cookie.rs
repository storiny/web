use actix_web::cookie::{Cookie, CookieJar, Key};

/// Examines the session cookie and tries to extract the session key.
///
/// Returns `None` if the session cookie is considered invalid (when failing a signature check).
///
/// * `cookie_value` - The value of the cookie.
/// * `key` - The secret key used to sign the cookie.
pub fn extract_session_key_from_cookie(cookie_value: &str, key: &Key) -> Option<String> {
    let mut jar = CookieJar::new();
    jar.add_original(Cookie::new("_storiny_sess", cookie_value.to_owned()));
    let result = jar.signed(key).get("_storiny_sess");
    result?.value().to_owned().try_into().ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn can_extract_session_key_from_cookie() {
        let session_key = Uuid::new_v4().to_string();
        let secret_key = Key::generate();
        let cookie = Cookie::new("_storiny_sess", session_key.clone());
        let mut jar = CookieJar::new();

        jar.signed_mut(&secret_key).add(cookie);

        let cookie = jar.delta().next().unwrap();
        let result = extract_session_key_from_cookie(cookie.value(), &secret_key);

        assert_eq!(result.unwrap(), session_key);
    }
}
