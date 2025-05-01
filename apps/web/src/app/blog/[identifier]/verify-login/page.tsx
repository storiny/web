import "server-only";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import { SESSION_COOKIE_ID, SESSION_COOKIE_MAX_AGE } from "~/common/constants";
import { verify_blog_login } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_url_or_path } from "~/common/utils";

import AuthLayout from "../../../(native)/(auth)/layout";
import Client from "./client";

const Page = async ({
  params,
  searchParams: search_params_loadable
}: {
  params: Promise<{ identifier: string }>;
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  searchParams: Promise<{ [_key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> => {
  const { identifier } = await params;
  const search_params = await search_params_loadable;
  const is_custom_domain = identifier.includes(".");
  const { token, "next-url": next_url, to } = search_params;

  // Only set cookies on custom domains.
  if (!is_custom_domain) {
    redirect("/");
  }

  const verify_login = async (): Promise<{
    message?: string;
    success: boolean;
  }> => {
    "use server";

    if (typeof token !== "string") {
      return {
        success: false,
        message: "missing or invalid token"
      };
    }

    const [cookie_store, header_store] = await Promise.all([
      cookies(),
      headers()
    ]);
    const origin = header_store.get("origin");
    let host: string;

    if (!origin) {
      return { success: false, message: "missing origin header" };
    }

    try {
      host = new URL(origin).hostname;
    } catch (_e) {
      // Invalid origin URL.
      return { success: false, message: `invalid origin header: ${origin}` };
    }

    try {
      const res = await verify_blog_login({
        blog_identifier: identifier,
        token,
        host
      });

      if (!res.is_token_valid || !res.cookie_value) {
        return { success: false, message: "invalid or expired token" };
      }

      // Set the session cookie.
      cookie_store.set({
        /* eslint-disable prefer-snakecase/prefer-snakecase */
        name: SESSION_COOKIE_ID,
        value: res.cookie_value,
        httpOnly: true,
        maxAge: res.is_persistent_cookie ? SESSION_COOKIE_MAX_AGE : undefined,
        domain: identifier,
        sameSite: "strict",
        secure: true,
        path: "/"
        /* eslint-enable prefer-snakecase/prefer-snakecase */
      });
    } catch (e) {
      handle_exception(e);
    }

    redirect(get_url_or_path(next_url) || get_url_or_path(to) || "/");
  };

  return (
    <AuthLayout>
      <Client verify_login={verify_login} />
    </AuthLayout>
  );
};

export { metadata } from "./metadata";
export default Page;
