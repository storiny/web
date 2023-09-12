import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { $getNodeByKey } from "lexical";
import React from "react";

import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import FigureFillIcon from "~/icons/figure-fill";
import FigureOverflowIcon from "~/icons/figure-overflow";

import { $isEmbedNode, EmbedNodeLayout } from "../../embed";
import styles from "../embed.module.scss";
import { EmbedNodeControlsProps } from "./node-controls.props";

const EmbedNodeControls = (
  props: EmbedNodeControlsProps
): React.ReactElement => {
  const { nodeKey, layout } = props;
  const [editor] = useLexicalComposerContext();

  /**
   * Updates the node layout
   */
  const setLayout = React.useCallback(
    (nextLayout: EmbedNodeLayout) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (
          $isEmbedNode(node) &&
          (["fill", "overflow"] as EmbedNodeLayout[]).includes(nextLayout)
        ) {
          node.setLayout(nextLayout);
        }
      });
    },
    [editor, nodeKey]
  );

  return (
    <ToggleGroup
      onValueChange={(value: EmbedNodeLayout): void => setLayout(value)}
      value={layout}
    >
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltipContent={"Fill"}
        value={"fill" as EmbedNodeLayout}
      >
        <FigureFillIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltipContent={"Overflow"}
        value={"overflow" as EmbedNodeLayout}
      >
        <FigureOverflowIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default EmbedNodeControls;
