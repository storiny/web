import "server-only";

import { notFound as not_found, redirect, RedirectType } from "next/navigation";

import { get_valid_month, get_valid_year } from "../../component";

const Page = async ({
  params
}: {
  params: { month: string; year: string };
}): Promise<void> => {
  const year = get_valid_year(params.year);
  const month = get_valid_month(params.month);

  if (!year || !month) {
    return not_found();
  }

  redirect(`/archive?year=${year}&month=${month}`, RedirectType.replace);
};

export { metadata } from "./metadata";
export default Page;
