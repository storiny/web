import dayjs from "dayjs";
import relative_time from "dayjs/plugin/relativeTime";

import { capitalize } from "~/utils/capitalize";

dayjs.extend(relative_time);

export enum DateFormat {
  LONG /*                */ = "MMM D, YYYY h:mm A",
  RELATIVE /*            */ = "relative",
  RELATIVE_CAPITALIZED /**/ = "relativeCapitalized",
  SHORT /*               */ = "MMM D",
  STANDARD /*            */ = "MMM D, YYYY",
  STATUS_EXPIRY /*       */ = "statusExp"
}

/**
 * Formats a date
 * @param date A string, timestamp, or a date object
 * @param format The format to use for formatting the date
 */
export const format_date = (
  date: string | number | Date | dayjs.Dayjs,
  format: DateFormat = DateFormat.STANDARD
): string =>
  format === DateFormat.STATUS_EXPIRY
    ? to_status_expiry_format(date)
    : format === DateFormat.RELATIVE
    ? dayjs(date).fromNow(false)
    : format === DateFormat.RELATIVE_CAPITALIZED
    ? capitalize(dayjs(date).fromNow(false))
    : dayjs(date).format(format);

const to_status_expiry_format = (
  date: string | number | Date | dayjs.Dayjs
): string => {
  const now = dayjs();
  const diff = dayjs(date).diff(now, "minute");

  if (diff >= 24 * 60) {
    // Status will expire in more than 24 hours.
    return `${Math.floor(diff / (24 * 60))}D`;
  } else if (diff >= 60) {
    // Status will expire in more than an hour but less than 24 hours.
    return `${Math.floor(diff / 60)}h`;
  } else {
    // Status will expire in less than 1 hour.
    return `${Math.ceil(diff)}m`;
  }
};

export { dayjs };
