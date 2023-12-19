import "server-only";

import { Status } from "@grpc/grpc-js/build/src/constants";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import { SESSION_COOKIE_ID } from "~/common/constants";
import { get_user_id } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

/**
 * Redirects to the login page if the user is logged out.
 */
const AlphaLayout = async ({
  children
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement | undefined> => {
  const next_url = headers().get("next-url") || "/";
  const cookie_store = cookies();
  const session_cookie = cookie_store.get(SESSION_COOKIE_ID);

  if (session_cookie) {
    const session_token = session_cookie.value;

    try {
      const user = await get_user_id({
        token: session_token
      });

      if (!user.id) {
        const to =
          next_url === "/" ? "" : `?to=${encodeURIComponent(next_url)}`;
        redirect(`/login${to}`);
      }

      return <React.Fragment>{children}</React.Fragment>;
    } catch (err) {
      const err_code = err?.code;

      // Session not found
      if (err_code === Status.NOT_FOUND) {
        redirect("/logout");
      } else {
        handle_exception(err);
      }
    }
  } else {
    redirect("/auth");
  }
};

export default AlphaLayout;
