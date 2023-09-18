import {
  $isElementNode,
  $isRootNode,
  $isTextNode,
  Klass,
  LexicalNode
} from "lexical";

import { Binding } from "../../collaboration/bindings";

const baseExcludedProperties = new Set<string>([
  "__key",
  "__parent",
  "__next",
  "__prev"
]);
const elementExcludedProperties = new Set<string>([
  "__first",
  "__last",
  "__size"
]);
const rootExcludedProperties = new Set<string>(["__cachedText"]);
const textExcludedProperties = new Set<string>(["__text"]);

/**
 * Predicate function for determining excluded properties
 * @param name Name
 * @param node Node
 * @param binding Binding
 */
export const isExcludedProperty = (
  name: string,
  node: LexicalNode,
  binding: Binding
): boolean => {
  if (baseExcludedProperties.has(name)) {
    return true;
  }

  if ($isTextNode(node)) {
    if (textExcludedProperties.has(name)) {
      return true;
    }
  } else if (
    $isElementNode(node) &&
    (elementExcludedProperties.has(name) ||
      ($isRootNode(node) && rootExcludedProperties.has(name)))
  ) {
    return true;
  }

  const nodeKlass = node.constructor as Klass<LexicalNode>;
  const excludedProperties = binding.excludedProperties.get(nodeKlass);
  return excludedProperties != null && excludedProperties.has(name);
};
