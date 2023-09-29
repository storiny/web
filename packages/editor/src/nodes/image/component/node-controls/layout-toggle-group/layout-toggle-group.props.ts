import { NodeKey } from "lexical";

import { ImageNodeLayout } from "../../../image";

export interface ImageLayoutToggleGroupProps {
  /**
   * Whether the `fit` layout is disabled
   */
  fit_disabled: boolean;
  /**
   * Image node layout
   */
  layout: ImageNodeLayout;
  /**
   * Image node key
   */
  node_key: NodeKey;
}
