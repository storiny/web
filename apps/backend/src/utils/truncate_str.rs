/// Truncates a string to the provided number of `max_chars`.
///
/// * `slice` - The string slice to truncate.
/// * `max_chars` - The character limit.
pub fn truncate_str(slice: &str, max_chars: usize) -> String {
    match slice.char_indices().nth(max_chars) {
        None => slice,
        Some((index, _)) => &slice[..index],
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_truncate_a_string() {
        assert_eq!(truncate_str("こんにちは", 0), "");
        assert_eq!(truncate_str("こんにちは", 4), "こんにち");
        assert_eq!(truncate_str("hello", 2), "he");
        assert_eq!(truncate_str("hello", 10), "hello");
    }
}
