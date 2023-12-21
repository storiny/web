"use client";

import { Doc } from "yjs";

import { Provider } from "../../collaboration/provider";
import { WebsocketProvider } from "../../collaboration/websocket";

const REALMS_ENDPOINT = process.env.NEXT_PUBLIC_REALMS_ENDPOINT as string;

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

  return new WebsocketProvider(REALMS_ENDPOINT, id, doc, {
    connect: false
  }) as unknown as Provider;
};
