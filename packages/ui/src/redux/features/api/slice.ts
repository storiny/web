import {
  createApi as create_api,
  fetchBaseQuery as fetch_base_query
} from "@reduxjs/toolkit/query/react";
import { API_VERSION } from "@storiny/shared";
import { SESSION_COOKIE_ID } from "@storiny/web/src/common/constants";
import cookie from "js-cookie";

/**
 * Reads and returns the authentication token from the session cookie. Used for
 * inserting the `Authorization` header in requests to the API server
 * originating from external blogs.
 */
export const get_auth_token_from_cookie = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = cookie.get(SESSION_COOKIE_ID);
  return value ? decodeURIComponent(value) : null;
};

/**
 * Determines the appropriate API server URL based on the current environment
 * and domain.
 *
 * - If the request originates from an external blog (i.e., a domain not
 * including `.storiny.com` in the host), the function will return a relative
 * path to the API proxy (`/api/proxy/v{API_VERSION}`), which forwards the
 * request to the main API server.
 *
 * - For requests originating from the `storiny.com` or its subdomains, it
 * returns the main API server URL.
 */
export const get_api_server_url = (): string => {
  if (
    typeof window !== "undefined" &&
    !window.location.host.includes(".storiny.com") &&
    process.env.NODE_ENV === "production"
  ) {
    return `/api/proxy`; // API proxy for blogs hosted on external domain.
  }

  return `${process.env.NEXT_PUBLIC_API_URL}`;
};

export const api_slice = create_api({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  reducerPath: "api",
  baseQuery: fetch_base_query({
    baseUrl: `${get_api_server_url()}/v${API_VERSION}`,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = get_auth_token_from_cookie();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    }
  }),
  tagTypes: [
    "Notification",
    "Asset",
    "Story",
    "Comment",
    "Reply",
    "Blog",
    "BlogRequest",
    "FriendRequest",
    "CollaborationRequest",
    "BlogEditorRequest",
    "BlogWriterRequest"
  ],
  endpoints: () => ({})
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});
