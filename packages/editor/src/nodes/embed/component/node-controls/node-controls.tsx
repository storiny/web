import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { $getNodeByKey as $get_node_by_key } from "lexical";
import React from "react";

import ToggleGroup from "~/components/toggle-group";
import ToggleGroupItem from "~/components/toggle-group-item";
import FigureFillIcon from "~/icons/figure-fill";
import FigureOverflowIcon from "~/icons/figure-overflow";

import { $is_embed_node, EmbedNodeLayout } from "../../embed";
import styles from "../embed.module.scss";
import { EmbedNodeControlsProps } from "./node-controls.props";

const EmbedNodeControls = (
  props: EmbedNodeControlsProps
): React.ReactElement => {
  const { node_key, layout } = props;
  const [editor] = use_lexical_composer_context();

  /**
   * Updates the node layout
   */
  const set_layout = React.useCallback(
    (next_layout: EmbedNodeLayout) => {
      editor.update(() => {
        const node = $get_node_by_key(node_key);
        if (
          $is_embed_node(node) &&
          (["fill", "overflow"] as EmbedNodeLayout[]).includes(next_layout)
        ) {
          node.set_layout(next_layout);
        }
      });
    },
    [editor, node_key]
  );

  return (
    <ToggleGroup
      onValueChange={(value: EmbedNodeLayout): void => set_layout(value)}
      value={layout}
    >
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltip_content={"Fill"}
        value={"fill" as EmbedNodeLayout}
      >
        <FigureFillIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltip_content={"Overflow"}
        value={"overflow" as EmbedNodeLayout}
      >
        <FigureOverflowIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default EmbedNodeControls;
