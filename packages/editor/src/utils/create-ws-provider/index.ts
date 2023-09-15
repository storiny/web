"use client";

import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";

import { Provider } from "../../collab/provider";

const WEBSOCKET_ENDPOINT = "ws://localhost:1234";
const WEBSOCKET_SLUG = "multiplayer";

/**
 * Creates a collaboration websocket provider
 * @param window Window
 * @param id Document ID
 * @param yjsDocMap Doc map
 */
export const createWebsocketProvider = (
  window: Window,
  id: string,
  yjsDocMap: Map<string, Doc>
): Provider => {
  const url = new URL(
    (window === window.parent ? window : window.parent).location.href
  );
  const params = new URLSearchParams(url.search);
  const WEBSOCKET_ID = params.get("collab_id") || "0";

  const roomName = `${WEBSOCKET_SLUG}/${WEBSOCKET_ID}/${id}`;
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  return new WebsocketProvider(WEBSOCKET_ENDPOINT, roomName, doc, {
    connect: false
  }) as unknown as Provider;
};
