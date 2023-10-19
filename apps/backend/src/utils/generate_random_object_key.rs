use nanoid::nanoid;
use rand::{
    distributions::Alphanumeric,
    Rng,
};

/// Generates a random unique key for a new object (S3).Also prepends the key with a random hash to
/// improve object retrieval performance under heavy workloads: https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html
pub fn generate_random_object_key() -> String {
    let prefix: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(8)
        .map(char::from)
        .collect();

    format!("{}-{}", prefix, nanoid!())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_generate_random_object_key() {
        let key = generate_random_object_key();
        assert!(key.chars().count() > 1);
    }
}
