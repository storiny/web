import {
  $isElementNode as $is_element_node,
  $isRootNode as $is_root_node,
  $isTextNode as $is_text_node,
  Klass,
  LexicalNode
} from "lexical";

import { Binding } from "../../collaboration/bindings";

const BASE_EXCLUDED_PROPERTIES = new Set<string>([
  "__key",
  "__parent",
  "__next",
  "__prev"
]);
const ELEMENT_EXCLUDED_PROPERTIES = new Set<string>([
  "__first",
  "__last",
  "__size"
]);
const ROOT_EXCLUDED_PROPERTIES = new Set<string>(["__cachedText"]);
const TEXT_EXCLUDED_PROPERTIES = new Set<string>(["__text"]);

/**
 * Predicate function for determining excluded properties
 * @param name Name
 * @param node Node
 * @param binding Binding
 */
export const is_excluded_property = (
  name: string,
  node: LexicalNode,
  binding: Binding
): boolean => {
  if (BASE_EXCLUDED_PROPERTIES.has(name)) {
    return true;
  }

  if ($is_text_node(node)) {
    if (TEXT_EXCLUDED_PROPERTIES.has(name)) {
      return true;
    }
  } else if (
    $is_element_node(node) &&
    (ELEMENT_EXCLUDED_PROPERTIES.has(name) ||
      ($is_root_node(node) && ROOT_EXCLUDED_PROPERTIES.has(name)))
  ) {
    return true;
  }

  const node_klass = node.constructor as Klass<LexicalNode>;
  const excluded_properties = binding.excluded_properties.get(node_klass);
  return excluded_properties != null && excluded_properties.has(name);
};
