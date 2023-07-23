import clsx from "clsx";
import { Rect } from "fabric";
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
import { selectActiveLayer, useEditorSelector } from "../../store";
import styles from "./Topbar.module.scss";

const MyToolKit = (): React.ReactElement => {
  const canvas = useCanvas();
  const drawRect = (): void => {
    canvas.current?.add(
      new Rect({
        borderColor: "#1371ec",
        cornerColor: "#fff",
        cornerSize: 10,
        cornerStrokeColor: "#1371ec",
        transparentCorners: false,
        fill: "#BFC1C5",
        padding: 0,
        borderOpacityWhenMoving: 0.25,
        strokeWidth: 0,
        height: 100,
        left: 100,
        top: 100,
        width: 100
      })
    );
  };

  return <button onClick={drawRect}>Draw</button>;
};

// Dimension

const Dimension = (): React.ReactElement | null => {
  const activeLayer = useEditorSelector(selectActiveLayer);

  if (!activeLayer) {
    return null;
  }

  return (
    <>
      <span>
        {Math.round(activeLayer.scaleX * 100)}×
        {Math.round(activeLayer.scaleY * 100)}
      </span>
      <span className={"t-muted"}>•</span>
    </>
  );
};

// Rotation

const Rotation = (): React.ReactElement => {
  const activeLayer = useEditorSelector(selectActiveLayer);
  return (
    <>
      <RotationIcon rotation={activeLayer?.angle || 0} />
      <span>
        (
        {typeof activeLayer?.angle === "number"
          ? Math.round(activeLayer.angle)
          : "-"}
        &deg;)
      </span>
    </>
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
    <Dimension />
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
