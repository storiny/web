import { Map as YMap, XmlElement, XmlText } from "yjs";

/**
 * Returns the node type from shared type
 * @param shared_type Shared type
 */
export const get_node_type_from_shared_type = (
  shared_type: XmlText | YMap<unknown> | XmlElement
): string => {
  const type =
    shared_type instanceof YMap
      ? shared_type.get("__type")
      : shared_type.getAttribute("__type");

  if (!type) {
    throw new Error("Expected shared type to include type attribute");
  }

  return type;
};
