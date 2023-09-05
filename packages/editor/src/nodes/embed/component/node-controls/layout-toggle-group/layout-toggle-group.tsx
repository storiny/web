import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { $getNodeByKey } from "lexical";
import React from "react";

import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import FigureFillIcon from "~/icons/figure-fill";
import FigureFitIcon from "~/icons/figure-fit";
import FigureOverflowIcon from "~/icons/figure-overflow";
import FigureScreenWidthIcon from "~/icons/figure-screen-width";

import { $isImageNode, ImageNodeLayout } from "../../../embed";
import styles from "../../embed.module.scss";
import { ImageLayoutToggleGroupProps } from "./layout-toggle-group.props";

const ImageLayoutToggleGroup = (
  props: ImageLayoutToggleGroupProps
): React.ReactElement => {
  const { fitDisabled, layout, nodeKey } = props;
  const [editor] = useLexicalComposerContext();

  /**
   * Updates the node layout
   */
  const setLayout = React.useCallback(
    (nextLayout: ImageNodeLayout) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (
          $isImageNode(node) &&
          (
            ["fit", "fill", "overflow", "screen-width"] as ImageNodeLayout[]
          ).includes(nextLayout)
        ) {
          node.setLayout(nextLayout);
        }
      });
    },
    [editor, nodeKey]
  );

  return (
    <ToggleGroup
      onValueChange={(value: ImageNodeLayout): void => setLayout(value)}
      value={layout}
    >
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        disabled={fitDisabled}
        slotProps={{
          tooltip: {
            rightSlot: fitDisabled
              ? "(Not available for multiple images)"
              : undefined
          }
        }}
        tooltipContent={"Fit"}
        value={"fit" as ImageNodeLayout}
      >
        <FigureFitIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltipContent={"Fill"}
        value={"fill" as ImageNodeLayout}
      >
        <FigureFillIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltipContent={"Overflow"}
        value={"overflow" as ImageNodeLayout}
      >
        <FigureOverflowIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltipContent={"Screen width"}
        value={"screen-width" as ImageNodeLayout}
      >
        <FigureScreenWidthIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ImageLayoutToggleGroup;
