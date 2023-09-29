import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { $getNodeByKey as $get_node_by_key } from "lexical";
import React from "react";

import ToggleGroup from "../../../../../../../ui/src/components/toggle-group";
import ToggleGroupItem from "../../../../../../../ui/src/components/toggle-group-item";
import FigureFillIcon from "~/icons/figure-fill";
import FigureFitIcon from "~/icons/figure-fit";
import FigureOverflowIcon from "~/icons/figure-overflow";
import FigureScreenWidthIcon from "~/icons/figure-screen-width";

import { $is_image_node, ImageNodeLayout } from "../../../image";
import styles from "../../image.module.scss";
import { ImageLayoutToggleGroupProps } from "./layout-toggle-group.props";

const ImageLayoutToggleGroup = (
  props: ImageLayoutToggleGroupProps
): React.ReactElement => {
  const { fit_disabled, layout, node_key } = props;
  const [editor] = use_lexical_composer_context();

  /**
   * Updates the node layout
   */
  const set_layout = React.useCallback(
    (next_layout: ImageNodeLayout) => {
      editor.update(() => {
        const node = $get_node_by_key(node_key);
        if (
          $is_image_node(node) &&
          (
            ["fit", "fill", "overflow", "screen-width"] as ImageNodeLayout[]
          ).includes(next_layout)
        ) {
          node.set_layout(next_layout);
        }
      });
    },
    [editor, node_key]
  );

  return (
    <ToggleGroup
      onValueChange={(value: ImageNodeLayout): void => set_layout(value)}
      value={layout}
    >
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        disabled={fit_disabled}
        slot_props={{
          tooltip: {
            right_slot: fit_disabled
              ? "(Not available for multiple images)"
              : undefined
          }
        }}
        tooltip_content={"Fit"}
        value={"fit" as ImageNodeLayout}
      >
        <FigureFitIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltip_content={"Fill"}
        value={"fill" as ImageNodeLayout}
      >
        <FigureFillIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltip_content={"Overflow"}
        value={"overflow" as ImageNodeLayout}
      >
        <FigureOverflowIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx("focus-invert", styles.x, styles.button)}
        tooltip_content={"Screen width"}
        value={"screen-width" as ImageNodeLayout}
      >
        <FigureScreenWidthIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ImageLayoutToggleGroup;
