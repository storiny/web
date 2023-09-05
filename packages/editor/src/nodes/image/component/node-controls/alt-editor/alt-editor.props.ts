import { NodeKey } from "lexical";

import { ImageItem } from "../../../image";

export interface ImageAltEditorProps {
  /**
   * Disabled flag
   */
  disabled: boolean;
  /**
   * Image item
   */
  image: ImageItem;
  /**
   * Image node key
   */
  nodeKey: NodeKey;
}
