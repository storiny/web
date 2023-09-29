import { LexicalNode } from "lexical";
import { Map as YMap, XmlElement, XmlText } from "yjs";

import { Binding } from "../../collaboration/bindings";
import { is_excluded_property } from "../is-excluded-property";

/**
 * Syncs properties from yjs
 * @param binding Binding
 * @param shared_type Shared type
 * @param lexical_node Lexical node
 * @param keys_changed Set of changed keys
 */
export const sync_properties_from_yjs = (
  binding: Binding,
  shared_type: XmlText | YMap<unknown> | XmlElement,
  lexical_node: LexicalNode,
  keys_changed: null | Set<string>
): void => {
  const properties =
    keys_changed === null
      ? shared_type instanceof YMap
        ? Array.from(shared_type.keys())
        : Object.keys(shared_type.getAttributes())
      : Array.from(keys_changed);
  let writable_node: LexicalNode | undefined;

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];

    if (is_excluded_property(property, lexical_node, binding)) {
      continue;
    }

    const prev_value = lexical_node[property];
    const next_value =
      shared_type instanceof YMap
        ? shared_type.get(property)
        : shared_type.getAttribute(property);

    if (prev_value !== next_value) {
      if (writable_node === undefined) {
        writable_node = lexical_node.getWritable();
      }

      writable_node[property] = next_value;
    }
  }
};
