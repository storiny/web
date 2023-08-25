import { waitForElement } from "@storiny/shared/src/utils/waitForElement";
import clsx from "clsx";
import React from "react";
import ReactDOM from "react-dom";

import Divider from "~/components/Divider";
import IconButton from "~/components/IconButton";
import Tooltip, { TooltipProvider } from "~/components/Tooltip";
import CopyIcon from "~/icons/Copy";
import FlipHorizontalIcon from "~/icons/FlipHorizontal";
import FlipVerticalIcon from "~/icons/FlipVertical";
import TrashIcon from "~/icons/Trash";

import { useActiveObject } from "../../../../hooks";
import { CLONE_PROPS } from "../../../../lib";
import { isLinearObject, recoverObject } from "../../../../utils";
import styles from "./actions.module.scss";

const POPOVER_ID = "object-popover";

const Actions = (): React.ReactElement | null => {
  const activeObject = useActiveObject();
  const [element, setElement] = React.useState<HTMLElement | Element | null>(
    null
  );

  React.useEffect(() => {
    waitForElement(`#${POPOVER_ID}`).then(setElement);
  }, []);

  if (!element) {
    return null;
  }

  /**
   * Clones the layer
   */
  const cloneLayer = (): void => {
    if (activeObject) {
      activeObject.clone(CLONE_PROPS).then((cloned) => {
        recoverObject(cloned, activeObject);

        if (isLinearObject(cloned)) {
          cloned.set({
            x1: activeObject.get("x1") + 24,
            x2: activeObject.get("x2") + 24,
            y1: activeObject.get("y1") + 24,
            y2: activeObject.get("y2") + 24
          });
        } else {
          cloned.top += 24;
          cloned.left += 24;
        }

        activeObject.canvas?.add(cloned);
      });
    }
  };

  /**
   * Flips the layer over the specified axis
   * @param axis Axis to flip over
   */
  const flipLayer = (axis: "x" | "y"): void => {
    const flipProp = `flip${axis.toUpperCase()}`;
    if (activeObject) {
      activeObject.toggle(flipProp);
      activeObject.rotate(-activeObject.get("angle")); // Flip angle
      activeObject.setCoords();

      if (activeObject.canvas) {
        activeObject.canvas?.requestRenderAll();
        activeObject.canvas?.fire?.("object:rotating", {
          target: activeObject
        } as any);
      }
    }
  };

  /**
   * Removes the layer
   */
  const removeLayer = (): void => {
    if (activeObject) {
      const canvas = activeObject.canvas;

      if (canvas) {
        canvas.remove(activeObject);
      }
    }
  };

  return ReactDOM.createPortal(
    <div className={clsx(clsx("flex-center", styles.x, styles.actions))}>
      <TooltipProvider disableHoverableContent>
        <Tooltip content={"Flip vertically"}>
          <IconButton
            className={clsx(styles.x, styles.button)}
            disabled={Boolean(activeObject && isLinearObject(activeObject))}
            onClick={(): void => flipLayer("y")}
            size={"sm"}
            variant={"ghost"}
          >
            <FlipVerticalIcon />
          </IconButton>
        </Tooltip>
        <Tooltip content={"Flip horizontally"}>
          <IconButton
            className={clsx(styles.x, styles.button)}
            disabled={Boolean(activeObject && isLinearObject(activeObject))}
            onClick={(): void => flipLayer("x")}
            size={"sm"}
            variant={"ghost"}
          >
            <FlipHorizontalIcon />
          </IconButton>
        </Tooltip>
        <Tooltip content={"Clone layer"}>
          <IconButton
            className={clsx(styles.x, styles.button)}
            onClick={cloneLayer}
            size={"sm"}
            variant={"ghost"}
          >
            <CopyIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation={"vertical"} />
        <Tooltip content={"Remove layer"}>
          <IconButton
            className={clsx(styles.x, styles.button)}
            color={"ruby"}
            onClick={removeLayer}
            size={"sm"}
            variant={"ghost"}
          >
            <TrashIcon />
          </IconButton>
        </Tooltip>
      </TooltipProvider>
    </div>,
    element
  );
};

export default Actions;
