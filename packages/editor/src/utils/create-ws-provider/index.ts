import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";

import { Provider } from "../../collab/provider";

const WEBSOCKET_ENDPOINT = "ws://localhost:1234";
const WEBSOCKET_SLUG = "playground";
const WEBSOCKET_ID = "0";

/**
 * Creates a collaboration websocket provider
 * @param id
 * @param yjsDocMap
 */
export const createWebsocketProvider = (
  id: string,
  yjsDocMap: Map<string, Doc>
): Provider => {
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
