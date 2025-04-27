import "server-only";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import {
  SESSION_COOKIE_DOMAIN,
  SESSION_COOKIE_ID,
  SESSION_COOKIE_MAX_AGE
} from "~/common/constants";
import { verify_blog_login } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

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
  const [{ identifier }, search_params] = await Promise.all([
    params,
    search_params_loadable
  ]);
  const is_custom_domain = identifier.includes(".");
  const { token, "next-url": next_url, to } = search_params;

  // Only set cookies on custom domains.
  if (!is_custom_domain) {
    redirect("/");
  }

  const verify_login = async (): Promise<boolean> => {
    "use server";

    const [cookie_store, header_store] = await Promise.all([
      cookies(),
      headers()
    ]);
    const origin = header_store.get("origin");
    let host: string;

    if (typeof token !== "string" || !origin) {
      return false;
    }

    try {
      host = new URL(origin).hostname;
    } catch (_e) {
      // Invalid origin URL.
      return false;
    }

    try {
      const res = await verify_blog_login({
        blog_identifier: identifier,
        token,
        host
      });

      if (!res.is_token_valid || !res.cookie_value) {
        return false;
      }

      // Set the session cookie.
      cookie_store.set({
        /* eslint-disable prefer-snakecase/prefer-snakecase */
        name: SESSION_COOKIE_ID,
        value: res.cookie_value,
        httpOnly: true,
        maxAge: res.is_persistent_cookie ? SESSION_COOKIE_MAX_AGE : undefined,
        sameSite: "none",
        domain: SESSION_COOKIE_DOMAIN,
        secure: true,
        path: "/"
        /* eslint-enable prefer-snakecase/prefer-snakecase */
      });
    } catch (e) {
      handle_exception(e);
    }

    redirect(
      typeof next_url === "string"
        ? next_url
        : typeof to === "string"
          ? to
          : "/"
    );
  };

  return (
    <AuthLayout>
      <Client verify_login={verify_login} />
    </AuthLayout>
  );
};

export { metadata } from "./metadata";
export default Page;
