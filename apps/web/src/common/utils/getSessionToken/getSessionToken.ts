import "server-only";

import { cookies } from "next/headers";

// TODO: Change cookie ID
export const SESSION_COOKIE_ID = "storiny.sid";

/**
 * Returns the session cookie value if present
 */
export const getSessionToken = (): string | null => {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_ID);
  return sessionCookie?.value || null;
};
