use std::convert::TryInto;

use rand::{distributions::Alphanumeric, rngs::OsRng, Rng as _};

use crate::storage::SessionKey;

/// Session key generation routine that follows [OWASP recommendations].
///
/// [OWASP recommendations]: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#session-id-entropy
pub(crate) fn generate_session_key(user_id: Option<String>) -> SessionKey {
    let value = std::iter::repeat(())
        .map(|()| OsRng.sample(Alphanumeric))
        .take(64)
        .collect::<Vec<_>>();

    // These unwraps will never panic because pre-conditions are always verified
    // (i.e. length and character set)
    let token: SessionKey = String::from_utf8(value).unwrap().try_into().unwrap();

    if let Some(user_id) = user_id {
        format!("{user_id}:{token}").try_into().unwrap_or(token)
    } else {
        token
    }
}
