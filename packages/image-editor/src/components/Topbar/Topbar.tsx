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
import { selectRotation, useEditorSelector } from "../../store";
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
        fill: "#BFC1C5",
        transparentCorners: false,
        padding: 0,
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

const Dimension = (): React.ReactElement => {
  const canvas = useCanvas();
  return (
    <span>
      <MyToolKit />
      {canvas.current?.width}×{canvas.current?.height}
    </span>
  );
};

// Rotation

const Rotation = (): React.ReactElement => {
  const rotation = useEditorSelector(selectRotation);
  return (
    <>
      <RotationIcon rotation={rotation} />
      <span>({rotation}&deg;)</span>
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
    <Dimension />
    <span className={"t-muted"}>•</span>
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
