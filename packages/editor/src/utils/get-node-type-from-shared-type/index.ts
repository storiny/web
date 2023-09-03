import { Map as YMap, XmlElement, XmlText } from "yjs";

/**
 * Returns the node type from shared type
 * @param sharedType Shared type
 */
export const getNodeTypeFromSharedType = (
  sharedType: XmlText | YMap<unknown> | XmlElement
): string => {
  const type =
    sharedType instanceof YMap
      ? sharedType.get("__type")
      : sharedType.getAttribute("__type");

  if (!type) {
    throw new Error("Expected shared type to include type attribute");
  }

  return type;
};
