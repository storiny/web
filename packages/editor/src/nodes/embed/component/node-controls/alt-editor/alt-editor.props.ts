import { NodeKey } from "lexical";

import { ImageItem } from "../../../embed";

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
