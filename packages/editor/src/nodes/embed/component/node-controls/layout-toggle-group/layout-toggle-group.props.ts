import { NodeKey } from "lexical";

import { ImageNodeLayout } from "../../../embed";

export interface ImageLayoutToggleGroupProps {
  /**
   * Whether the `fit` layout is disabled
   */
  fitDisabled: boolean;
  /**
   * Image node layout
   */
  layout: ImageNodeLayout;
  /**
   * Image node key
   */
  nodeKey: NodeKey;
}
