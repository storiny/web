import { wait_for_element } from "@storiny/shared/src/utils/wait-for-element";
import clsx from "clsx";
import React from "react";
import { createPortal as create_portal } from "react-dom";

import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Tooltip, { TooltipProvider } from "~/components/tooltip";
import CopyIcon from "~/icons/copy";
import FlipHorizontalIcon from "~/icons/flip-horizontal";
import FlipVerticalIcon from "~/icons/flip-vertical";
import TrashIcon from "~/icons/trash";

import { use_active_object } from "../../../../hooks";
import { CLONE_PROPS } from "../../../../lib";
import { is_linear_object, recover_object } from "../../../../utils";
import styles from "./actions.module.scss";

const POPOVER_ID = "object-popover";

const Actions = (): React.ReactElement | null => {
  const active_object = use_active_object();
  const [element, set_element] = React.useState<HTMLElement | Element | null>(
    null
  );

  React.useEffect(() => {
    wait_for_element(`#${POPOVER_ID}`).then(set_element);
  }, []);

  if (!element) {
    return null;
  }

  /**
   * Clones the layer
   */
  const clone_layer = (): void => {
    if (active_object) {
      active_object.clone(CLONE_PROPS).then((cloned) => {
        recover_object(cloned, active_object);

        if (is_linear_object(cloned)) {
          cloned.set({
            x1: active_object.get("x1") + 24,
            x2: active_object.get("x2") + 24,
            y1: active_object.get("y1") + 24,
            y2: active_object.get("y2") + 24
          });
        } else {
          cloned.top += 24;
          cloned.left += 24;
        }

        active_object.canvas?.add(cloned);
      });
    }
  };

  /**
   * Flips the layer over the specified axis
   * @param axis Axis to flip over
   */
  const flip_layer = (axis: "x" | "y"): void => {
    const flip_prop = `flip${axis.toUpperCase()}`;
    if (active_object) {
      active_object.toggle(flip_prop);
      active_object.rotate(-active_object.get("angle")); // Flip angle
      active_object.setCoords();

      if (active_object.canvas) {
        active_object.canvas?.requestRenderAll();
        active_object.canvas?.fire?.("object:rotating", {
          target: active_object
        } as any);
      }
    }
  };

  /**
   * Removes the layer
   */
  const remove_layer = (): void => {
    if (active_object) {
      const canvas = active_object.canvas;

      if (canvas) {
        canvas.remove(active_object);
      }
    }
  };

  return create_portal(
    <div className={clsx(clsx("flex-center", styles.x, styles.actions))}>
      <TooltipProvider disableHoverableContent>
        <Tooltip content={"Flip vertically"}>
          <IconButton
            className={clsx(styles.x, styles.button)}
            disabled={Boolean(active_object && is_linear_object(active_object))}
            onClick={(): void => flip_layer("y")}
            size={"sm"}
            variant={"ghost"}
          >
            <FlipVerticalIcon />
          </IconButton>
        </Tooltip>
        <Tooltip content={"Flip horizontally"}>
          <IconButton
            className={clsx(styles.x, styles.button)}
            disabled={Boolean(active_object && is_linear_object(active_object))}
            onClick={(): void => flip_layer("x")}
            size={"sm"}
            variant={"ghost"}
          >
            <FlipHorizontalIcon />
          </IconButton>
        </Tooltip>
        <Tooltip content={"Clone layer"}>
          <IconButton
            className={clsx(styles.x, styles.button)}
            onClick={clone_layer}
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
            onClick={remove_layer}
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
