import { LexicalNode } from "lexical";
import { Doc, Map as YMap, XmlElement, XmlText } from "yjs";

import { Binding } from "../../collaboration/bindings";
import { isExcludedProperty } from "../is-excluded-property";

/**
 * Syncs properties from the editor
 * @param binding Binding
 * @param sharedType Shared type
 * @param prevLexicalNode Previous node
 * @param nextLexicalNode Next node
 */
export const syncPropertiesFromLexical = (
  binding: Binding,
  sharedType: XmlText | YMap<unknown> | XmlElement,
  prevLexicalNode: null | LexicalNode,
  nextLexicalNode: LexicalNode
): void => {
  const type = nextLexicalNode.__type;
  const nodeProperties = binding.nodeProperties;
  let properties = nodeProperties.get(type);

  if (properties === undefined) {
    properties = Object.keys(nextLexicalNode).filter(
      (property) => !isExcludedProperty(property, nextLexicalNode, binding)
    );
    nodeProperties.set(type, properties);
  }

  const EditorClass = binding.editor.constructor;

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const prevValue =
      prevLexicalNode === null ? undefined : prevLexicalNode[property];
    let nextValue = nextLexicalNode[property];

    if (prevValue !== nextValue) {
      if (nextValue instanceof EditorClass) {
        const yjsDocMap = binding.docMap;
        let prevDoc: Doc | undefined;

        if (prevValue instanceof EditorClass) {
          // @ts-expect-error Lexical node
          const prevKey = prevValue._key;
          prevDoc = yjsDocMap.get(prevKey);
          yjsDocMap.delete(prevKey);
        }

        // If we already have a document, use it
        const doc = prevDoc || new Doc();
        const key = doc.guid;

        // @ts-expect-error Lexical node
        nextValue._key = key;
        yjsDocMap.set(key, doc);
        nextValue = doc;

        // Mark the node dirty as we've assigned a new key to it
        binding.editor.update(() => {
          nextLexicalNode.markDirty();
        });
      }

      if (sharedType instanceof YMap) {
        sharedType.set(property, nextValue);
      } else {
        sharedType.setAttribute(property, nextValue);
      }
    }
  }
};
