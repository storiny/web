import { LexicalNode } from "lexical";
import { Doc, Map as YMap, XmlElement, XmlText } from "yjs";

import { Binding } from "../../collaboration/bindings";
import { is_excluded_property } from "../is-excluded-property";

/**
 * Syncs properties from the editor
 * @param binding Binding
 * @param shared_type Shared type
 * @param prev_lexical_node Previous node
 * @param next_lexical_node Next node
 */
export const sync_properties_from_lexical = (
  binding: Binding,
  shared_type: XmlText | YMap<unknown> | XmlElement,
  prev_lexical_node: null | LexicalNode,
  next_lexical_node: LexicalNode
): void => {
  const type = next_lexical_node.__type;
  const node_properties = binding.node_properties;
  let properties = node_properties.get(type);

  if (properties === undefined) {
    properties = Object.keys(next_lexical_node).filter(
      (property) => !is_excluded_property(property, next_lexical_node, binding)
    );
    node_properties.set(type, properties);
  }

  const EditorClass = binding.editor.constructor;

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const prev_value =
      prev_lexical_node === null ? undefined : prev_lexical_node[property];
    let next_value = next_lexical_node[property];

    if (prev_value !== next_value) {
      if (next_value instanceof EditorClass) {
        const yjs_doc_map = binding.doc_map;
        let prev_doc: Doc | undefined;

        if (prev_value instanceof EditorClass) {
          // @ts-expect-error Lexical node
          const prev_key = prev_value._key;
          prev_doc = yjs_doc_map.get(prev_key);
          yjs_doc_map.delete(prev_key);
        }

        // If we already have a document, use it
        const doc = prev_doc || new Doc();
        const key = doc.guid;

        // @ts-expect-error Lexical node
        next_value._key = key;
        yjs_doc_map.set(key, doc);
        next_value = doc;

        // Mark the node dirty as we've assigned a new key to it
        binding.editor.update(() => {
          next_lexical_node.markDirty();
        });
      }

      if (shared_type instanceof YMap) {
        shared_type.set(property, next_value);
      } else {
        shared_type.setAttribute(property, next_value);
      }
    }
  }
};
