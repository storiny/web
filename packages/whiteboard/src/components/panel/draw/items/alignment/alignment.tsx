import clsx from "clsx";
import React from "react";

import Divider from "../../../../../../../ui/src/components/divider";
import IconButton, {
  IconButtonProps
} from "../../../../../../../ui/src/components/icon-button";
import Spacer from "../../../../../../../ui/src/components/spacer";
import Tooltip from "../../../../../../../ui/src/components/tooltip";
import LayoutAlignBottomIcon from "../../../../../../../ui/src/icons/layout-align-bottom";
import LayoutAlignCenterIcon from "../../../../../../../ui/src/icons/layout-align-center";
import LayoutAlignLeftIcon from "../../../../../../../ui/src/icons/layout-align-left";
import LayoutAlignMiddleIcon from "../../../../../../../ui/src/icons/layout-align-middle";
import LayoutAlignRightIcon from "../../../../../../../ui/src/icons/layout-align-right";
import LayoutAlignTopIcon from "../../../../../../../ui/src/icons/layout-align-top";
import { use_canvas, use_event_render } from "../../../../../hooks";
import { is_group, modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";
import styles from "./alignment.module.scss";

type TAlignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

const AlignButton = ({
  children,
  tooltip_content,
  ...rest
}: IconButtonProps & {
  tooltip_content: React.ReactNode;
}): React.ReactElement => (
  <Tooltip content={tooltip_content}>
    <IconButton {...rest} className={"f-grow"} size={"sm"} variant={"ghost"}>
      {children}
    </IconButton>
  </Tooltip>
);

const Alignment = (): React.ReactElement | null => {
  const canvas = use_canvas();
  const active_objects = canvas.current?.getActiveObjects();
  const group = active_objects?.length > 1 && active_objects?.[0]?.group;

  use_event_render("selection:created", () => false);
  use_event_render("selection:updated", () => true);
  use_event_render("selection:cleared", () => true);

  /**
   * Changes the alignment of the object
   * @param next_alignemnt New alignment
   */
  const change_alignment = React.useCallback(
    (next_alignemnt: TAlignment) => {
      if (!group) {
        return;
      }

      for (const object of group.getObjects()) {
        const bounding_rect = object.getBoundingRect(true);

        switch (next_alignemnt) {
          case "top":
            modify_object(object, {
              top: group.top - bounding_rect.top + object.top
            });
            break;
          case "left":
            modify_object(object, {
              left: group.left - bounding_rect.left + object.left
            });
            break;
          case "bottom":
            modify_object(object, {
              top:
                group.top +
                group.height -
                (bounding_rect.top + bounding_rect.height) +
                object.top
            });
            break;
          case "right":
            modify_object(object, {
              left:
                group.left +
                group.width -
                (bounding_rect.left + bounding_rect.width) +
                object.left
            });
            break;
          case "center":
            modify_object(object, {
              left:
                group.left +
                group.width / 2 -
                (bounding_rect.left + bounding_rect.width / 2) +
                object.left
            });
            break;
          case "middle":
            modify_object(object, {
              top:
                group.top +
                group.height / 2 -
                (bounding_rect.top + bounding_rect.height / 2) +
                object.top
            });
            break;
        }

        object.setCoords();
        canvas.current?.renderAll();
      }
    },
    [canvas, group]
  );

  if (!group || !is_group(group)) {
    return null;
  }

  return (
    <>
      <Spacer orientation={"vertical"} />
      <DrawItem className={clsx(styles.x, styles.item)}>
        <DrawItemRow
          style={{
            gap: "2px",
            justifyContent: "space-between"
          }}
        >
          <AlignButton
            aria-label={"Align left"}
            onClick={(): void => change_alignment("left")}
            tooltip_content={"Align left"}
          >
            <LayoutAlignLeftIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align center"}
            onClick={(): void => change_alignment("center")}
            tooltip_content={"Align center"}
          >
            <LayoutAlignCenterIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align right"}
            onClick={(): void => change_alignment("right")}
            tooltip_content={"Align right"}
          >
            <LayoutAlignRightIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align top"}
            onClick={(): void => change_alignment("top")}
            tooltip_content={"Align top"}
          >
            <LayoutAlignTopIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align middle"}
            onClick={(): void => change_alignment("middle")}
            tooltip_content={"Align middle"}
          >
            <LayoutAlignMiddleIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align bottom"}
            onClick={(): void => change_alignment("bottom")}
            tooltip_content={"Align bottom"}
          >
            <LayoutAlignBottomIcon />
          </AlignButton>
        </DrawItemRow>
      </DrawItem>
      <Divider />
    </>
  );
};

export default Alignment;
