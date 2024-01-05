import "server-only";

import { cookies } from "next/headers";
import React from "react";

import { SESSION_COOKIE_ID } from "~/common/constants";

import Client from "./client";

const Page = async ({
  searchParams: search_params
}: {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<React.ReactElement> => {
  const logout = async (): Promise<void> => {
    "use server";

    cookies().set({
      name: SESSION_COOKIE_ID,
      value: "",
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      maxAge: 0,
      path: "/"
    });
  };

  return (
    <Client
      logout={logout}
      to={
        typeof search_params.to === "string"
          ? decodeURIComponent(search_params.to)
          : "/login"
      }
    />
  );
};

export { metadata } from "./metadata";
export default Page;
