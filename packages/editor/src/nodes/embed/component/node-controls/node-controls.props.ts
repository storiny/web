import { NodeKey } from "lexical";

import { ImageItem, ImageNodeLayout } from "../../embed";

export interface ImageNodeControlsProps {
  /**
   * Image items
   */
  images: ImageItem[];
  /**
   * Image node layout
   */
  layout: ImageNodeLayout;
  /**
   * Image node key
   */
  nodeKey: NodeKey;
}
