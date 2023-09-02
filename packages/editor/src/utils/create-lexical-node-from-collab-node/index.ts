import {
  DecoratorNode,
  ElementNode,
  LexicalNode,
  NodeKey,
  TextNode
} from "lexical";

import { Binding } from "../../collab/bindings";
import { CollabDecoratorNode } from "../../collab/nodes/decorator";
import { CollabElementNode } from "../../collab/nodes/element";
import { CollabLineBreakNode } from "../../collab/nodes/line-break";
import { CollabTextNode } from "../../collab/nodes/text";

/**
 * Creates a lexical node from a collab node
 * @param binding Binding
 * @param collabNode Collab node
 * @param parentKey Parent node key
 */
export const createLexicalNodeFromCollabNode = (
  binding: Binding,
  collabNode:
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode,
  parentKey: NodeKey
): LexicalNode => {
  const type = collabNode.getType();
  const registeredNodes = binding.editor._nodes;
  const nodeInfo = registeredNodes.get(type);

  if (!nodeInfo) {
    throw new Error(`Node ${type} is not registered`);
  }

  const lexicalNode:
    | DecoratorNode<unknown>
    | TextNode
    | ElementNode
    | LexicalNode = new nodeInfo.klass();
  lexicalNode.__parent = parentKey;
  collabNode._key = lexicalNode.__key;

  if (collabNode instanceof CollabElementNode) {
    const xmlText = collabNode._xmlText;
    collabNode.syncPropertiesFromYjs(binding, null);
    collabNode.applyChildrenYjsDelta(binding, xmlText.toDelta());
    collabNode.syncChildrenFromYjs(binding);
  } else if (collabNode instanceof CollabTextNode) {
    collabNode.syncPropertiesAndTextFromYjs(binding, null);
  } else if (collabNode instanceof CollabDecoratorNode) {
    collabNode.syncPropertiesFromYjs(binding, null);
  }

  binding.collabNodeMap.set(lexicalNode.__key, collabNode);
  return lexicalNode;
};
