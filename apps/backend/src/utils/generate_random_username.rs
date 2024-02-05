use crate::constants::reserved_keywords::RESERVED_KEYWORDS;
use nanoid::nanoid;
use slugify::slugify;
use sqlx::{
    Postgres,
    Transaction,
};

/// The maximum number of attempts for generating a unique username.
const MAX_USERNAME_GENERATE_ATTEMPTS: u8 = 25;

/// The maximum number of characters for a username.
const USERNAME_MAX_CHARS: usize = 24;

/// The length of the random username suffix.
const SUFFIX_LENGTH: usize = 4;

/// Generates a random and unique username based on a prefix value. Returns a unqiue random ID when
/// the number of generation attempts are exceeded.
///
/// * `prefix` - The username string prefix.
/// * `txn` - The Postgres transaction.
pub async fn generate_random_username<'a>(
    prefix: &str,
    txn: &mut Transaction<'a, Postgres>,
) -> Result<String, sqlx::Error> {
    let character_set: [char; 36] = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
        'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ];

    let mut username_retries: u8 = 0;
    let slugged_prefix = slugify!(
        prefix,
        separator = "_",
        max_length = USERNAME_MAX_CHARS - SUFFIX_LENGTH - 1 // Extra -1 for the underscore
    );
    let mut username = format!(
        "{}_{}",
        slugged_prefix,
        nanoid!(SUFFIX_LENGTH, &character_set)
    );

    while RESERVED_KEYWORDS.contains(&username.as_str())
        || match sqlx::query(
            r#"
SELECT 1 FROM users
WHERE username = $1
"#,
        )
        .bind(&username)
        .fetch_one(&mut **txn)
        .await
        {
            Ok(_) => true,
            Err(error) => match error {
                sqlx::Error::RowNotFound => false,
                _ => return Err(error),
            },
        }
    {
        if username_retries < MAX_USERNAME_GENERATE_ATTEMPTS {
            username_retries += 1;
            username = format!(
                "{}_{}",
                slugged_prefix,
                nanoid!(SUFFIX_LENGTH, &character_set)
            );
        } else {
            // Use a random ID as the username when we run out of generate attempts.
            username = nanoid!(USERNAME_MAX_CHARS, &character_set);
        }
    }

    Ok(username)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_generate_a_random_username(pool: PgPool) -> sqlx::Result<()> {
        let mut txn = pool.begin().await?;
        let username = generate_random_username("test", &mut txn).await;

        assert!(username.is_ok());
        assert!(username.unwrap().starts_with("test"));

        Ok(())
    }
}
