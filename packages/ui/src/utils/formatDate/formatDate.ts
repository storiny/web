import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { capitalize } from "~/utils/capitalize";

dayjs.extend(relativeTime);

export enum DateFormat {
  LONG /*                */ = "MMM D, YYYY h:mm A",
  RELATIVE /*            */ = "relative",
  RELATIVE_CAPITALIZED /**/ = "relativeCapitalized",
  SHORT /*               */ = "MMM D",
  STANDARD /*            */ = "MMM D, YYYY"
}

/**
 * Formats a date
 * @param date A string, timestamp, or a date object
 * @param template The template to use for formatting the date
 */
export const formatDate = (
  date: string | number | Date | dayjs.Dayjs,
  template: DateFormat = DateFormat.STANDARD
): string =>
  template === DateFormat.RELATIVE
    ? dayjs(date).fromNow(false)
    : template === DateFormat.RELATIVE_CAPITALIZED
    ? capitalize(dayjs(date).fromNow(false))
    : dayjs(date).format(template);

export { dayjs };
