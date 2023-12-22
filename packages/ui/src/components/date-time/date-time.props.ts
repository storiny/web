import { format_date } from "~/utils/format-date";

export interface DateTimeProps {
  /**
   * The date value.
   */
  date: Parameters<typeof format_date>[0];
  /**
   * The date format.
   * @default DateFormat.STANDARD
   */
  format?: Parameters<typeof format_date>[1];
}
