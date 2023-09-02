import { createEditor, LexicalNode } from "lexical";
import { Doc, Map as YMap, XmlElement, XmlText } from "yjs";

import { Binding } from "../../collab/bindings";
import { isExcludedProperty } from "../is-excluded-property";

/**
 * Syncs properties from yjs
 * @param binding Binding
 * @param sharedType Shared type
 * @param lexicalNode Lexical node
 * @param keysChanged Set of changed keys
 */
export const syncPropertiesFromYjs = (
  binding: Binding,
  sharedType: XmlText | YMap<unknown> | XmlElement,
  lexicalNode: LexicalNode,
  keysChanged: null | Set<string>
): void => {
  const properties =
    keysChanged === null
      ? sharedType instanceof YMap
        ? Array.from(sharedType.keys())
        : Object.keys(sharedType.getAttributes())
      : Array.from(keysChanged);
  let writableNode: LexicalNode | undefined;

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];

    if (isExcludedProperty(property, lexicalNode, binding)) {
      continue;
    }

    const prevValue = lexicalNode[property];
    let nextValue =
      sharedType instanceof YMap
        ? sharedType.get(property)
        : sharedType.getAttribute(property);

    if (prevValue !== nextValue) {
      if (nextValue instanceof Doc) {
        const yjsDocMap = binding.docMap;

        if (prevValue instanceof Doc) {
          yjsDocMap.delete(prevValue.guid);
        }

        const nestedEditor = createEditor();
        const key = nextValue.guid;
        nestedEditor._key = key;
        yjsDocMap.set(key, nextValue);

        nextValue = nestedEditor;
      }

      if (writableNode === undefined) {
        writableNode = lexicalNode.getWritable();
      }

      writableNode[property] = nextValue;
    }
  }
};
