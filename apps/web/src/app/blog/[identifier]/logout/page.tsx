import "server-only";

import { cookies } from "next/headers";
import React from "react";

import { SESSION_COOKIE_DOMAIN, SESSION_COOKIE_ID } from "~/common/constants";

import AuthLayout from "../../../(native)/(auth)/layout";
import Client from "../../../logout/client";

const Page = async ({
  params,
  searchParams: search_params_loadable
}: {
  params: Promise<{ identifier: string }>;

  searchParams: Promise<{ [_key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> => {
  const { identifier } = await params;
  const search_params = await search_params_loadable;
  const is_custom_domain = identifier.includes(".");

  const logout = async (): Promise<void> => {
    "use server";

    // Delete the cookie.
    (await cookies()).set({
      name: SESSION_COOKIE_ID,
      value: "",
      httpOnly: !is_custom_domain,
      maxAge: 0,
      sameSite: "strict",
      domain: is_custom_domain ? identifier : SESSION_COOKIE_DOMAIN,
      secure: true,
      path: "/"
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
