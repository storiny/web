"use client";

import { Doc } from "yjs";

import { SESSION_COOKIE_ID } from "~/common/constants";

import { Provider } from "../../collaboration/provider";
import { WebsocketProvider } from "../../collaboration/websocket";

const REALMS_ENDPOINT = process.env.NEXT_PUBLIC_REALMS_ENDPOINT as string;

/**
 * Extracts and returns the session cookie value if present.
 */
const get_session_cookie_value = (): string => {
  const match = document.cookie.match(
    RegExp(
      "(?:^|;\\s*)" +
        SESSION_COOKIE_ID.replace(/([.*+?$(){}|])/g, "\\$1") +
        "=([^;]*)"
    )
  );

  return match ? match[1] : "";
};

/**
 * Creates a collaboration websocket provider
 * @param id Document ID
 * @param yjs_doc_map Doc map
 */
export const create_ws_provider = (
  id: string,
  yjs_doc_map: Map<string, Doc>
): Provider => {
  let doc = yjs_doc_map.get("main");

  if (doc === undefined) {
    doc = new Doc();
    yjs_doc_map.set("main", doc);
  } else {
    doc.load();
  }

  return new WebsocketProvider(
    REALMS_ENDPOINT,
    get_session_cookie_value(),
    id,
    doc,
    {
      connect: false
    }
  ) as unknown as Provider;
};
