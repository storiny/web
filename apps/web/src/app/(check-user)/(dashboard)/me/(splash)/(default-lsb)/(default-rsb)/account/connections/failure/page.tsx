import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import {
  PROVIDER_DISPLAY_NAME_MAP,
  PROVIDER_KEY_MAP
} from "../../../../../../../../../providers";
import ConnectionFailureClient from "./client";

const Page = ({
  searchParams: search_params
}: {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  searchParams: { [key: string]: string | string[] | undefined };
}): React.ReactElement => {
  const provider = Object.keys(PROVIDER_KEY_MAP).find(
    (key) => PROVIDER_KEY_MAP[key] === search_params.provider || ""
  );

  if (
    !provider ||
    !search_params.type ||
    !["state-mismatch", "link"].includes(String(search_params.type))
  ) {
    redirect("/me/settings/connections");
  }

  return (
    <ConnectionFailureClient
      display_name={PROVIDER_DISPLAY_NAME_MAP[provider]}
      type={search_params.type as "state-mismatch" | "link"}
    />
  );
};

export default Page;
