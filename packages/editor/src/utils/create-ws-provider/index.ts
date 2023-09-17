"use client";

import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";

import { Provider } from "../../collab/provider";

const WEBSOCKET_ENDPOINT = "ws://localhost:1234";

/**
 * Creates a collaboration websocket provider
 * @param id Document ID
 * @param yjsDocMap Doc map
 */
export const createWebsocketProvider = (
  id: string,
  yjsDocMap: Map<string, Doc>
): Provider => {
  const roomName = `multiplayer/${id}`;
  let doc = yjsDocMap.get("main");

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set("main", doc);
  } else {
    doc.load();
  }

  return new WebsocketProvider(WEBSOCKET_ENDPOINT, roomName, doc, {
    connect: false
  }) as unknown as Provider;
};
