import { notFound as not_found } from "next/navigation";
import React from "react";

import ArchivePage from "../../page";
import { get_valid_month } from "./get-valid-month";
import { get_valid_year } from "./get-valid-year";

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

export default Page;
