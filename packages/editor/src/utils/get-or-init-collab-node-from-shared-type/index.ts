import { Map as YMap, XmlElement, XmlText } from "yjs";

import { Binding } from "../../collaboration/bindings";
import {
  $createCollabDecoratorNode,
  CollabDecoratorNode
} from "../../collaboration/nodes/decorator";
import {
  $createCollabElementNode,
  CollabElementNode
} from "../../collaboration/nodes/element";
import {
  $createCollabLineBreakNode,
  CollabLineBreakNode
} from "../../collaboration/nodes/line-break";
import {
  $createCollabTextNode,
  CollabTextNode
} from "../../collaboration/nodes/text";
import { getNodeTypeFromSharedType } from "../get-node-type-from-shared-type";

/**
 * Returns initialized collab node from the shared type
 * @param binding Binding
 * @param sharedType Shared type
 * @param parent Parent node
 */
export const getOrInitCollabNodeFromSharedType = (
  binding: Binding,
  sharedType: XmlText | YMap<unknown> | XmlElement,
  parent?: CollabElementNode
):
  | CollabElementNode
  | CollabTextNode
  | CollabLineBreakNode
  | CollabDecoratorNode => {
  // @ts-expect-error: internal field
  const collabNode = sharedType._collabNode;

  if (collabNode === undefined) {
    const registeredNodes = binding.editor._nodes;
    const type = getNodeTypeFromSharedType(sharedType);
    const nodeInfo = registeredNodes.get(type);

    if (!nodeInfo) {
      throw new Error(`Node ${type} is not registered`);
    }

    const sharedParent = sharedType.parent;
    const targetParent =
      parent === undefined && sharedParent !== null
        ? getOrInitCollabNodeFromSharedType(
            binding,
            sharedParent as XmlText | YMap<unknown> | XmlElement
          )
        : parent || null;

    if (!(targetParent instanceof CollabElementNode)) {
      throw new Error("Expected parent to be a collab element node");
    }

    if (sharedType instanceof XmlText) {
      return $createCollabElementNode(sharedType, targetParent, type);
    } else if (sharedType instanceof YMap) {
      if (type === "linebreak") {
        return $createCollabLineBreakNode(sharedType, targetParent);
      }

      return $createCollabTextNode(sharedType, "", targetParent, type);
    } else if ((sharedType as unknown) instanceof XmlElement) {
      return $createCollabDecoratorNode(sharedType, targetParent, type);
    }
  }

  return collabNode;
};
