"use client";

import { Doc } from "yjs";

import { Provider } from "../../collaboration/provider";
import { WebsocketProvider } from "../../collaboration/websocket";

// TODO: Change endpoint
const WEBSOCKET_ENDPOINT = "ws://localhost:1234";

/**
 * Creates a collaboration websocket provider
 * @param id Document ID
 * @param yjs_doc_map Doc map
 */
export const create_ws_provider = (
  id: string,
  yjs_doc_map: Map<string, Doc>
): Provider => {
  const room_name = `realms/${id}`;
  let doc = yjs_doc_map.get("main");

  if (doc === undefined) {
    doc = new Doc();
    yjs_doc_map.set("main", doc);
  } else {
    doc.load();
  }

  return new WebsocketProvider(WEBSOCKET_ENDPOINT, room_name, doc, {
    connect: false
  }) as unknown as Provider;
};
