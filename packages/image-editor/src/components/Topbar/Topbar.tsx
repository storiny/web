import clsx from "clsx";
import { Rect, util } from "fabric";
import React from "react";
import rough from "roughjs/bin/rough";

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
import {
  mutateLayer,
  selectActiveLayer,
  useEditorDispatch,
  useEditorSelector
} from "../../store";
import styles from "./Topbar.module.scss";

Rect.prototype._render = function (ctx): void {
  const rc = rough.canvas(ctx.canvas);
  const { width: w, height: h } = this;
  const x = -w / 2;
  const y = -h / 2;

  if (!this.get("seed")) {
    this.set("seed", rough.newSeed());
  }

  rc.draw(
    rc.rectangle(x, y, w, h, {
      seed: this.get("seed"),
      stroke: this.stroke as string,
      strokeWidth: this.strokeWidth,
      fill: this.fill as string,
      fillWeight: this.fillWeight || 1,
      fillStyle: this.fillStyle || "hachure",
      hachureGap: this.get("hachureGap") || 5,
      roughness: this.get("roughness") || 1
    })
  );
};

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
        fill: "#969696",
        stroke: "#000000",
        padding: 0,
        borderOpacityWhenMoving: 0.25,
        strokeWidth: 0,
        noScaleCache: false,
        height: 100,
        left: 100,
        top: 100,
        width: 100
      })
    );
  };

  return <button onClick={drawRect}>Draw</button>;
};

// Rotation

const Rotation = (): React.ReactElement => {
  const activeLayer = useEditorSelector(selectActiveLayer);
  const dispatch = useEditorDispatch();

  return (
    <div
      className={"flex-center"}
      onClick={(): void => {
        if (activeLayer) {
          dispatch(mutateLayer({ id: activeLayer.id, angle: 0 }));
        }
      }}
      {...(activeLayer
        ? {
            title: "Reset rotation",
            role: "button",
            tabIndex: 0,
            style: { cursor: "pointer" }
          }
        : {})}
    >
      <RotationIcon rotation={activeLayer?.angle || 0} />
      <Spacer size={0.5} />
      <span>
        (
        {typeof activeLayer?.angle === "number"
          ? Math.round(activeLayer.angle)
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
