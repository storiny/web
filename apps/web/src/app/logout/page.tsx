import "server-only";

import { cookies } from "next/headers";
import React from "react";

import { SESSION_COOKIE_DOMAIN, SESSION_COOKIE_ID } from "~/common/constants";

import AuthLayout from "../(native)/(auth)/layout";
import Client from "./client";

const Page = async ({
  searchParams: search_params_loadable
}: {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  searchParams: Promise<{ [_key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> => {
  const search_params = await search_params_loadable;
  const logout = async (): Promise<void> => {
    "use server";

    // Delete the cookie.
    (await cookies()).set({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      name: SESSION_COOKIE_ID,
      value: "",
      httpOnly: true,
      maxAge: 0,
      sameSite: "strict",
      domain: SESSION_COOKIE_DOMAIN,
      secure: true,
      path: "/"
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });
  };

  return (
    <AuthLayout>
      <Client
        logout={logout}
        to={
          typeof search_params.to === "string"
            ? decodeURIComponent(search_params.to)
            : "/login"
        }
      />
    </AuthLayout>
  );
};

export { metadata } from "./metadata";
export default Page;
