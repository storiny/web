import "server-only";

import { cookies } from "next/headers";

// TODO: Change cookie ID
export const SESSION_COOKIE_ID = "storiny.sid";

/**
 * Returns the session cookie value if present
 */
export const get_session_token = (): string | null => {
  const cookie_store = cookies();
  const session_cookie = cookie_store.get(SESSION_COOKIE_ID);
  return session_cookie?.value || null;
};
