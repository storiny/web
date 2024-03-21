use nanoid::nanoid;
use slugify::slugify;
use sqlx::PgConnection;

/// The maximum number of retries before a random fixed-length ID suffix is used
/// for the story slug generation procedure.
const MAX_SLUG_GENERATE_ATTEMPTS: u8 = 10;

/// Generates a unique slug for the story.
///
/// * `conn` - A Postgres connection.
/// * `story_id` - The ID of the story.
/// * `title` - The title of the story.
pub async fn generate_story_slug(
    conn: &mut PgConnection,
    story_id: &i64,
    title: &str,
) -> Result<String, sqlx::Error> {
    let character_set: [char; 36] = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
        'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ];

    // Use a larger ID length for "Untitled story" as it is the default title
    // used for the stories.
    let mut id_length = if title == "Untitled story" { 9 } else { 3 };
    let mut slug_retries: u8 = 0;
    let slugged_title = slugify!(&title, separator = "-", max_length = 64);
    let mut story_slug = format!("{}-{}", slugged_title, nanoid!(id_length, &character_set));

    while match sqlx::query(
        r#"
SELECT 1 FROM stories
WHERE slug = $1
"#,
    )
    .bind(&story_slug)
    .fetch_one(&mut *conn)
    .await
    {
        Ok(_) => true,
        Err(error) => match error {
            sqlx::Error::RowNotFound => false,
            _ => return Err(error),
        },
    } {
        if slug_retries < MAX_SLUG_GENERATE_ATTEMPTS {
            id_length += 1;
            slug_retries += 1;

            // Generate a new slug with bigger ID suffix.
            story_slug = format!("{}-{}", slugged_title, nanoid!(id_length, &character_set));
        } else {
            // Use the `story_id` as the suffix when we run out of all
            // the slug generation attempts.
            story_slug = format!("{}-{}", slugged_title, story_id);
        }
    }

    Ok(story_slug)
}
