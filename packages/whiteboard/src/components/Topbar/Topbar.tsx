import clsx from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import RedoIcon from "~/icons/Redo";
import RotationIcon from "~/icons/Rotation";
import UndoIcon from "~/icons/Undo";

import { useCanvas } from "../../hooks";
import { useActiveObject, useEventRender } from "../../hooks";
import Cancel from "./Cancel";
import Confirm from "./Confirm";
import MainMenu from "./MainMenu";
import styles from "./Topbar.module.scss";

// Rotation

const Rotation = (): React.ReactElement => {
  const activeObject = useActiveObject();
  useEventRender(
    "object:rotating",
    (options) => options.target.get("id") === activeObject?.get("id")
  );

  return (
    <div
      className={"flex-center"}
      onClick={(): void => {
        if (activeObject) {
          activeObject.rotate(0);

          if (activeObject.canvas) {
            activeObject.canvas?.requestRenderAll();
            activeObject.canvas?.fire?.("object:rotating", {
              target: activeObject
            } as any);
          }
        }
      }}
      {...(activeObject
        ? {
            title: "Reset rotation",
            role: "button",
            tabIndex: 0,
            style: { cursor: "pointer" }
          }
        : {})}
    >
      <RotationIcon rotation={activeObject?.angle || 0} />
      <Spacer size={0.5} />
      <span>
        (
        {typeof activeObject?.angle === "number"
          ? Math.round(activeObject.angle)
          : "-"}
        &deg;)
      </span>
    </div>
  );
};

// Status bar

const StatusBar = (): React.ReactElement => (
  <Typography
    as={"div"}
    className={clsx(
      "flex-center",
      "f-grow",
      "t-minor",
      styles.x,
      styles["status-bar"]
    )}
  >
    <Rotation />
  </Typography>
);

// History

const History = (): React.ReactElement => {
  const canvas = useCanvas();

  /**
   * Undo
   */
  const undo = (): void => {
    if (canvas.current) {
      canvas.current.historyManager.undo();
    }
  };

  /**
   * Redo
   */
  const redo = (): void => {
    if (canvas.current) {
      canvas.current.historyManager.redo();
    }
  };

  return (
    <>
      <Tooltip content={"Undo"}>
        <IconButton
          aria-label={"Undo changes"}
          className={clsx("focus-invert", styles.x, styles["icon-button"])}
          onClick={undo}
          variant={"ghost"}
        >
          <UndoIcon />
        </IconButton>
      </Tooltip>
      <Tooltip content={"Redo"}>
        <IconButton
          aria-label={"Redo changes"}
          className={clsx("focus-invert", styles.x, styles["icon-button"])}
          onClick={redo}
          variant={"ghost"}
        >
          <RedoIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

const Topbar = (): React.ReactElement => (
  <div className={clsx("flex-center", styles.x, styles.topbar)}>
    <MainMenu />
    <History />
    <Spacer size={2} />
    <StatusBar />
    <Spacer size={2} />
    <Tooltip content={"Cancel editing"}>
      <Cancel />
    </Tooltip>
    <Tooltip content={"Confirm"}>
      <Confirm />
    </Tooltip>
  </div>
);

export default Topbar;
