import clsx from "clsx";
import React from "react";

import IconButton from "../../../../ui/src/components/icon-button";
import Spacer from "../../../../ui/src/components/spacer";
import Tooltip from "../../../../ui/src/components/tooltip";
import Typography from "../../../../ui/src/components/typography";
import RedoIcon from "../../../../ui/src/icons/redo";
import RotationIcon from "../../../../ui/src/icons/rotation";
import UndoIcon from "../../../../ui/src/icons/undo";

import { use_active_object, use_canvas, use_event_render } from "../../hooks";
import Cancel from "./cancel";
import Confirm from "./confirm";
import MainMenu from "./main-menu";
import styles from "./topbar.module.scss";

// Rotation

const Rotation = (): React.ReactElement => {
  const active_object = use_active_object();
  use_event_render(
    "object:rotating",
    (options) => options.target.get("id") === active_object?.get("id")
  );

  return (
    <div
      className={"flex-center"}
      onClick={(): void => {
        if (active_object) {
          active_object.rotate(0);

          if (active_object.canvas) {
            active_object.canvas?.requestRenderAll();
            active_object.canvas?.fire?.("object:rotating", {
              target: active_object
            } as any);
          }
        }
      }}
      {...(active_object
        ? {
            title: "Reset rotation",
            role: "button",
            tabIndex: 0,
            style: { cursor: "pointer" }
          }
        : {})}
    >
      <RotationIcon rotation={active_object?.angle || 0} />
      <Spacer size={0.5} />
      <span>
        (
        {typeof active_object?.angle === "number"
          ? Math.round(active_object.angle)
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
      "t-mono",
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
  const canvas = use_canvas();

  /**
   * Undo
   */
  const undo = (): void => {
    if (canvas.current) {
      canvas.current.history_manager.undo();
    }
  };

  /**
   * Redo
   */
  const redo = (): void => {
    if (canvas.current) {
      canvas.current.history_manager.redo();
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
