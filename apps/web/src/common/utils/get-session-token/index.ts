import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_ID } from "~/common/constants";

/**
 * Returns the session cookie value if present
 */
export const get_session_token = async (): Promise<string | null> => {
  const cookie_store = await cookies();
  const session_cookie = cookie_store.get(SESSION_COOKIE_ID);
  return session_cookie?.value || null;
};
