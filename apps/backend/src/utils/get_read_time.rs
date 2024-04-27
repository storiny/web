/// The default reading speed.
const DEFAULT_WPM: u32 = 250;

/// Computes the reading time (in minutes) based on the reading speed.
///
/// * `word_count` - The total number of words.
/// * `wpm` - The optional reading speed in words per minute. Defaults to [DEFAULT_WPM].
pub fn get_read_time(word_count: u32, wpm: Option<u32>) -> u16 {
    let word_count = word_count.max(1);
    let wpm = wpm.unwrap_or(DEFAULT_WPM).max(1);

    (word_count / wpm).max(1) as u16
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_return_read_time() {
        assert_eq!(get_read_time(250, None), 1);
        assert_eq!(get_read_time(1024, None), 4);
        assert_eq!(get_read_time(2000, Some(302)), 6);
    }
}
