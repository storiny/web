import "server-only";

import { cookies } from "next/headers";
import React from "react";

import { SESSION_COOKIE_ID } from "~/common/constants";

import Client from "../../../logout/client";

const Page = async ({
  params,
  searchParams: search_params_loadable
}: {
  params: Promise<{ identifier: string }>;
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> => {
  const { identifier } = await params;
  const search_params = await search_params_loadable;

  const logout = async (): Promise<void> => {
    "use server";

    // Delete the cookie.
    (await cookies()).set({
      name: SESSION_COOKIE_ID,
      value: "",
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      httpOnly: true,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      maxAge: 0,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      sameSite: "none",
      domain: identifier.includes(".") ? identifier : ".storiny.com", // Identifier is the domain name.
      secure: true,
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
