import "server-only";

import { redirect, RedirectType } from "next/navigation";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "";

const Page = async ({
  params,
  searchParams: search_params_loadable
}: {
  params: Promise<{ identifier: string }>;
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  searchParams: Promise<{ [_key: string]: string | string[] | undefined }>;
}): Promise<never> => {
  const { identifier } = await params;
  const search_params = await search_params_loadable;
  const out_params = new URLSearchParams(
    Object.entries(search_params || {}).flatMap(([key, value]) => {
      if (typeof value === "string") {
        return [[key, decodeURIComponent(value)]];
      }

      if (Array.isArray(value) && value.length) {
        return [[key, decodeURIComponent(value[value.length - 1])]];
      }

      return [];
    })
  );

  out_params.set("blog", identifier);

  redirect(`${WEB_URL}/login?${out_params.toString()}`, RedirectType.replace);
};

export { metadata } from "./metadata";
export default Page;
