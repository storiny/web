import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import {
  providerDisplayNameMap,
  providerKeyMap
} from "../../../../../../../../../providers";
import ConnectionFailureClient from "./client";

const Page = ({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): React.ReactElement => {
  const provider = Object.keys(providerKeyMap).find(
    (key) => providerKeyMap[key] === searchParams.provider || ""
  );

  if (
    !provider ||
    !searchParams.type ||
    !["state-mismatch", "link"].includes(String(searchParams.type))
  ) {
    redirect("/me/settings/connections");
  }

  return (
    <ConnectionFailureClient
      displayName={providerDisplayNameMap[provider]}
      type={searchParams.type as "state-mismatch" | "link"}
    />
  );
};

export default Page;
