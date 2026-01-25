import "server-only";

import { cookies } from "next/headers";
import React from "react";

import { SESSION_COOKIE_DOMAIN, SESSION_COOKIE_ID } from "~/common/constants";

import AuthLayout from "../(native)/(auth)/layout";
import Client from "./client";

const Page = async ({
  searchParams
}: {
  searchParams: Promise<{ [_key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> => {
  const to = (await searchParams).to;
  const logout = async (): Promise<void> => {
    "use server";

    // Delete the cookie.
    (await cookies()).set({
      name: SESSION_COOKIE_ID,
      value: "",
      httpOnly: true,
      maxAge: 0,
      sameSite: "strict",
      domain: SESSION_COOKIE_DOMAIN,
      secure: true,
      path: "/"
    });
  };

  return (
    <AuthLayout>
      <Client
        logout={logout}
        to={typeof to === "string" ? decodeURIComponent(to) : "/login"}
      />
    </AuthLayout>
  );
};

export { metadata } from "./metadata";
export default Page;
