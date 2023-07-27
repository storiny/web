import clsx from "clsx";
import { BaseFabricObject, Group } from "fabric";
import React from "react";

import Divider from "~/components/Divider";
import IconButton, { IconButtonProps } from "~/components/IconButton";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import AlignBottomIcon from "~/icons/AlignBottom";
import AlignCenterIcon from "~/icons/AlignCenter";
import AlignLeftIcon from "~/icons/AlignLeft";
import AlignMiddleIcon from "~/icons/AlignMiddle";
import AlignRightIcon from "~/icons/AlignRight";
import AlignTopIcon from "~/icons/AlignTop";

import { useCanvas } from "../../../../../hooks";
import { useEventRender } from "../../../../../store";
import { isGroup } from "../../../../../utils";
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
  const [group, setGroup] = React.useState<Group | null>(null);
  const selectMaybeGroup = (object: BaseFabricObject): void => {
    const activeObject = canvas.current?.getActiveObject();
    console.log(activeObject);
    if (activeObject) {
      if (isGroup(activeObject)) {
        setGroup(activeObject);
      } else if (activeObject.group) {
        setGroup(activeObject.group);
      }
    }
  };

  useEventRender("selection:created", (options) => {
    const object = options.selected[0];
    selectMaybeGroup(object);

    return false;
  });

  useEventRender("selection:updated", (options) => {
    const object = options.selected[0];
    selectMaybeGroup(object);

    return false;
  });

  useEventRender("selection:cleared", () => {
    setGroup(null);
    return false;
  });

  /**
   * Changes the alignment of the object
   * @param newAlignment New alignment
   */
  const changeAlignment = React.useCallback(
    (newAlignemnt: TAlignment) => {
      // const canvas = activeObject?.canvas;
      //
      // if (activeObject && canvas) {
      //   const boundingRect = activeObject.getBoundingRect();
      //   const { width, height } = canvas;
      //
      //   switch (newAlignemnt) {
      //     case "top":
      //       activeObject.set({
      //         top: activeObject.top - boundingRect.top,
      //         dirty: true
      //       });
      //       break;
      //     case "left":
      //       activeObject.set({
      //         left: activeObject.left - boundingRect.left,
      //         dirty: true
      //       });
      //       break;
      //     case "bottom":
      //       activeObject.set({
      //         top: canvas.height - boundingRect.height / 2,
      //         dirty: true
      //       });
      //       break;
      //     case "right":
      //       activeObject.set({
      //         left: canvas.width - boundingRect.width / 2,
      //         dirty: true
      //       });
      //       break;
      //     case "center":
      //       activeObject.set({ left: width / 2, dirty: true });
      //       break;
      //     case "middle":
      //       activeObject.set({ top: height / 2, dirty: true });
      //       break;
      //   }
      //
      //   activeObject.setCoords();
      //   canvas.requestRenderAll();
      // }
    },
    [
      //    activeObject
    ]
  );

  React.useEffect(() => console.log(group), [group]);

  if (!group) {
    return null;
  }

  return (
    <>
      <Spacer orientation={"vertical"} size={1} />
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
            <AlignLeftIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align center"}
            onClick={(): void => changeAlignment("center")}
            tooltipContent={"Align center"}
          >
            <AlignCenterIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align right"}
            onClick={(): void => changeAlignment("right")}
            tooltipContent={"Align right"}
          >
            <AlignRightIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align top"}
            onClick={(): void => changeAlignment("top")}
            tooltipContent={"Align top"}
          >
            <AlignTopIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align middle"}
            onClick={(): void => changeAlignment("middle")}
            tooltipContent={"Align middle"}
          >
            <AlignMiddleIcon />
          </AlignButton>
          <AlignButton
            aria-label={"Align bottom"}
            onClick={(): void => changeAlignment("bottom")}
            tooltipContent={"Align bottom"}
          >
            <AlignBottomIcon />
          </AlignButton>
        </DrawItemRow>
      </DrawItem>
      <Divider />
    </>
  );
};

export default Alignment;
