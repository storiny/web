use sitemap_rs::url::ChangeFrequency;

/// Maps a change frequency string value to its enum value.
///
/// * `change_freq` - The change frequency value.
pub fn get_sitemap_change_freq(change_freq: &str) -> ChangeFrequency {
    match change_freq {
        "weekly" => ChangeFrequency::Weekly,
        "monthly" => ChangeFrequency::Monthly,
        _ => ChangeFrequency::Yearly,
    }
}

#[cfg(test)]
mod tests {
    use super::get_sitemap_change_freq;
    use sitemap_rs::url::ChangeFrequency;

    #[test]
    fn can_return_sitemap_change_freq() {
        let (weekly, monthly, invariant) = (
            get_sitemap_change_freq("weekly"),
            get_sitemap_change_freq("monthly"),
            get_sitemap_change_freq("some_invalid_value"),
        );

        assert!(matches!(weekly, ChangeFrequency::Weekly));
        assert!(matches!(monthly, ChangeFrequency::Monthly));
        assert!(matches!(invariant, ChangeFrequency::Yearly));
    }
}
