import clsx from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import IconButton, { IconButtonProps } from "~/components/IconButton";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import LayoutAlignBottomIcon from "~/icons/LayoutAlignBottom";
import LayoutAlignCenterIcon from "~/icons/LayoutAlignCenter";
import LayoutAlignLeftIcon from "~/icons/LayoutAlignLeft";
import LayoutAlignMiddleIcon from "~/icons/LayoutAlignMiddle";
import LayoutAlignRightIcon from "~/icons/LayoutAlignRight";
import LayoutAlignTopIcon from "~/icons/LayoutAlignTop";

import { useCanvas, useEventRender } from "../../../../../hooks";
import { isGroup, modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../Item";
import styles from "./Alignment.module.scss";

type TAlignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

const AlignButton = ({
  children,
  tooltipContent,
  ...rest
}: IconButtonProps & {
  tooltipContent: React.ReactNode;
}): React.ReactElement => (
  <Tooltip content={tooltipContent}>
    <IconButton {...rest} className={"f-grow"} size={"sm"} variant={"ghost"}>
      {children}
    </IconButton>
  </Tooltip>
);

const Alignment = (): React.ReactElement | null => {
  const canvas = useCanvas();
  const activeObjects = canvas.current?.getActiveObjects();
  const group = activeObjects?.length > 1 && activeObjects?.[0]?.group;

  useEventRender("selection:created", () => false);
  useEventRender("selection:updated", () => true);
  useEventRender("selection:cleared", () => true);

  /**
   * Changes the alignment of the object
   * @param newAlignment New alignment
   */
  const changeAlignment = React.useCallback(
    (newAlignemnt: TAlignment) => {
      if (!group) {
        return;
      }

      for (const object of group.getObjects()) {
        const boundingRect = object.getBoundingRect(true);

        switch (newAlignemnt) {
          case "top":
            modifyObject(object, {
              top: group.top - boundingRect.top + object.top
            });
            break;
          case "left":
            modifyObject(object, {
              left: group.left - boundingRect.left + object.left
            });
            break;
          case "bottom":
            modifyObject(object, {
              top:
                group.top +
                group.height -
                (boundingRect.top + boundingRect.height) +
                object.top
            });
            break;
          case "right":
            modifyObject(object, {
              left:
                group.left +
                group.width -
                (boundingRect.left + boundingRect.width) +
                object.left
            });
            break;
          case "center":
            modifyObject(object, {
              left:
                group.left +
                group.width / 2 -
                (boundingRect.left + boundingRect.width / 2) +
                object.left
            });
            break;
          case "middle":
            modifyObject(object, {
              top:
                group.top +
                group.height / 2 -
                (boundingRect.top + boundingRect.height / 2) +
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

  if (!group || !isGroup(group)) {
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
            onClick={(): void => changeAlignment("left")}
            tooltipContent={"Align left"}
          >
            <LayoutAlignLeftIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align center"}
            onClick={(): void => changeAlignment("center")}
            tooltipContent={"Align center"}
          >
            <LayoutAlignCenterIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align right"}
            onClick={(): void => changeAlignment("right")}
            tooltipContent={"Align right"}
          >
            <LayoutAlignRightIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align top"}
            onClick={(): void => changeAlignment("top")}
            tooltipContent={"Align top"}
          >
            <LayoutAlignTopIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align middle"}
            onClick={(): void => changeAlignment("middle")}
            tooltipContent={"Align middle"}
          >
            <LayoutAlignMiddleIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align bottom"}
            onClick={(): void => changeAlignment("bottom")}
            tooltipContent={"Align bottom"}
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
