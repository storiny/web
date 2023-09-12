import { NodeKey } from "lexical";

import { EmbedNodeLayout } from "../../embed";

export interface EmbedNodeControlsProps {
  /**
   * Embed node layout
   */
  layout: EmbedNodeLayout;
  /**
   * Embed node key
   */
  nodeKey: NodeKey;
}
