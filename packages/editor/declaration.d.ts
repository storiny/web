import { CollabDecoratorNode } from "./src/collaboration/nodes/decorator";
import { CollabElementNode } from "./src/collaboration/nodes/element";
import { CollabLineBreakNode } from "./src/collaboration/nodes/line-break";
import { CollabTextNode } from "./src/collaboration/nodes/text";

declare module "*.scss";

export declare module "yjs" {
  interface XmlElement {
    _collab_node: CollabDecoratorNode;
  }

  interface XmlText {
    _collab_node: CollabElementNode;
  }

  interface Map {
    _collab_node: CollabLineBreakNode | CollabTextNode;
  }
}
