import "server-only";

import { Status } from "@grpc/grpc-js/build/src/constants";
import { cookies } from "next/headers";

import { getUserId } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";

// TODO: Change cookie ID
export const SESSION_COOKIE_ID = "storiny.sid";

/**
 * Checks whether the user maintains a valid session by sending a
 * validation request to the backend server with the session cookie
 * data. Returns the user's ID if the user is logged in, `null` otherwise
 *
 * @param shallow Whether to do a shallow check. Only checks the presence
 * of the cookie, and returns a boolean value if the cookie exists
 */
export const getUser = async (
  shallow?: boolean
): Promise<typeof shallow extends true ? boolean : string | null> => {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_ID);

  if (sessionCookie) {
    const sessionToken = sessionCookie.value;

    try {
      const user = await getUserId({
        token: sessionToken
      });

      return user.id;
    } catch (e) {
      // Not found error is thrown if the token is stale or invalid
      const errCode = e?.code;

      // User not found
      if (errCode === Status.NOT_FOUND) {
        cookieStore.delete(SESSION_COOKIE_ID); // Remove stale or invalid cookie
        return null;
      }

      handleException(e);
    }
  }

  return null;
};
