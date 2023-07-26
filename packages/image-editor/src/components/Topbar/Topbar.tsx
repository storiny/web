import clsx from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import CheckIcon from "~/icons/Check";
import DownloadIcon from "~/icons/Download";
import RedoIcon from "~/icons/Redo";
import RotationIcon from "~/icons/Rotation";
import UndoIcon from "~/icons/Undo";
import XIcon from "~/icons/X";

import { useCanvas } from "../../hooks";
import { Rect } from "../../lib";
import { useActiveObject, useEventRender } from "../../store";
import styles from "./Topbar.module.scss";

const MyToolKit = (): React.ReactElement => {
  const canvas = useCanvas();
  const drawRect = (): void => {
    canvas.current?.add(new Rect({}));
  };

  return <button onClick={drawRect}>Draw</button>;
};

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
    <MyToolKit />
    <Rotation />
  </Typography>
);

const Topbar = (): React.ReactElement => (
  <div className={clsx("flex-center", styles.x, styles.topbar)}>
    <Tooltip content={"Download"}>
      <IconButton
        aria-label={"Download image"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        variant={"ghost"}
      >
        <DownloadIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Undo"}>
      <IconButton
        aria-label={"Undo changes"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        variant={"ghost"}
      >
        <UndoIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Redo"}>
      <IconButton
        aria-label={"Redo changes"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        variant={"ghost"}
      >
        <RedoIcon />
      </IconButton>
    </Tooltip>
    <Spacer size={2} />
    <StatusBar />
    <Spacer size={2} />
    <Tooltip content={"Cancel editing"}>
      <IconButton
        aria-label={"Cancel editing"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        variant={"ghost"}
      >
        <XIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Confirm"}>
      <IconButton
        aria-label={"Confirm"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
      >
        <CheckIcon />
      </IconButton>
    </Tooltip>
  </div>
);

export default Topbar;
