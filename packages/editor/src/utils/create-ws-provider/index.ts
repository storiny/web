import { Provider } from "@lexical/yjs";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";

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
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  return new WebsocketProvider(
    WEBSOCKET_ENDPOINT,
    WEBSOCKET_SLUG + "/" + WEBSOCKET_ID + "/" + id,
    doc,
    {
      connect: false
    }
  ) as unknown as Provider;
};
