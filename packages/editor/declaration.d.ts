import { CollabElementNode } from "./src/collaboration/nodes/element";
import { CollabLineBreakNode } from "./src/collaboration/nodes/line-break";
import { CollabTextNode } from "./src/collaboration/nodes/text";
import { CollabDecoratorNode } from "./src/collaboration/nodes/decorator";

declare module "*.scss";

export declare module "yjs" {
  interface XmlElement {
    _collab_node: CollabDecoratorNode;
  }

  interface XmlText {
    _collab_node: CollabElementNode;
  }
}

export declare module "yjs/dist/src/internals" {
  interface YMap {
    _collab_node: CollabLineBreakNode | CollabTextNode;
  }
}
