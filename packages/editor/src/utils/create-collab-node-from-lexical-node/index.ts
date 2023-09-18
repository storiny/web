import {
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  LexicalNode
} from "lexical";
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

/**
 * Creates a collab node from a lexical node
 * @param binding Binding
 * @param lexicalNode Lexical node
 * @param parent Parent collab node
 */
export const $createCollabNodeFromLexicalNode = (
  binding: Binding,
  lexicalNode: LexicalNode,
  parent: CollabElementNode
):
  | CollabElementNode
  | CollabTextNode
  | CollabLineBreakNode
  | CollabDecoratorNode => {
  const nodeType = lexicalNode.__type;
  let collabNode;

  if ($isElementNode(lexicalNode)) {
    const xmlText = new XmlText();
    collabNode = $createCollabElementNode(xmlText, parent, nodeType);
    collabNode.syncPropertiesFromLexical(binding, lexicalNode, null);
    collabNode.syncChildrenFromLexical(binding, lexicalNode, null, null, null);
  } else if ($isTextNode(lexicalNode)) {
    // TODO: Create a token text node for `token`, `segmented` nodes
    const map = new YMap();

    collabNode = $createCollabTextNode(
      map,
      lexicalNode.__text,
      parent,
      nodeType
    );
    collabNode.syncPropertiesAndTextFromLexical(binding, lexicalNode, null);
  } else if ($isLineBreakNode(lexicalNode)) {
    const map = new YMap();
    map.set("__type", "linebreak");
    collabNode = $createCollabLineBreakNode(map, parent);
  } else if ($isDecoratorNode(lexicalNode)) {
    const xmlElem = new XmlElement();
    collabNode = $createCollabDecoratorNode(xmlElem, parent, nodeType);
    collabNode.syncPropertiesFromLexical(binding, lexicalNode, null);
  } else {
    throw new Error("Expected text, element, decorator, or linebreak node");
  }

  collabNode._key = lexicalNode.__key;
  return collabNode;
};
