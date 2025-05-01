"use server";

import "server-only";

import { Status } from "@grpc/grpc-js/build/src/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_ID } from "~/common/constants";
import { get_user_id } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

/**
 * Checks whether the user maintains a valid session by sending a
 * validation request to the backend server with the session cookie
 * data. Returns the user's ID if the user is logged in, `null` otherwise
 *
 * @param ignore_redirect Whether to ignore redirecting to `/logout` page.
 */
export const get_user = async (
  ignore_redirect?: boolean
): Promise<string | null> => {
  const cookie_store = await cookies();
  const session_cookie = cookie_store.get(SESSION_COOKIE_ID);

  if (session_cookie) {
    const session_token = session_cookie.value;

    try {
      const user = await get_user_id({
        token: session_token
      });

      return user.id;
    } catch (e) {
      // Not found error is thrown if the token is stale or invalid
      const err_code = e?.code;

      // Session not found
      if (err_code === Status.NOT_FOUND) {
        if (!ignore_redirect) {
          redirect("/logout");
        }
      } else {
        handle_exception(e);
      }
    }
  }

  return null;
};
