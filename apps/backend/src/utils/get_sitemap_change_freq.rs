use sitemap_rs::url::ChangeFrequency;
use time::OffsetDateTime;

pub fn get_sitemap_change_freq(date: OffsetDateTime) -> ChangeFrequency {
    if (date.isAfter(dayjs().utcOffset(0).startOf('week'))) {
        return EnumChangefreq.WEEKLY;
    }

    if (
        date.isAfter(dayjs().utcOffset(0).startOf('month').subtract(6, 'month'))
    ) {
        return EnumChangefreq.MONTHLY;
    }

    ChangeFrequency::Yearly
}
