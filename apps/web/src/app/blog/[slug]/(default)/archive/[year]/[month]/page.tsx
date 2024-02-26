import { notFound as not_found } from "next/navigation";
import React from "react";

import ArchivePage from "../../page";

/**
 * Parses and returns the valid year
 * @param value The year value
 */
export const get_valid_year = (value = ""): number | undefined => {
  const year = Number.parseInt(value);

  if (year > 1000 && year < 5000) {
    return year;
  }

  return undefined;
};

/**
 * Parses and returns the valid month
 * @param value The month value
 */
export const get_valid_month = (value = ""): number | undefined => {
  const month = Number.parseInt(value);

  if (month > 0 && month <= 12) {
    return month;
  }

  return undefined;
};

const Page = ({
  params
}: {
  params: { month: string; year: string };
}): React.ReactElement | void => {
  const year = get_valid_year(params.year);
  const month = get_valid_month(params.month);

  if (!year || !month) {
    return not_found();
  }

  return <ArchivePage month={month} year={year} />;
};

export { metadata } from "./metadata";
export default Page;
