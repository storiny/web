import clsx from "clsx";
import React from "react";
import { useFilePicker } from "use-file-picker";

import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import CheckIcon from "~/icons/Check";
import DownloadIcon from "~/icons/Download";
import FolderOpenIcon from "~/icons/FolderOpen";
import ImageIcon from "~/icons/Image";
import MenuIcon from "~/icons/Menu";
import RedoIcon from "~/icons/Redo";
import RotationIcon from "~/icons/Rotation";
import TrashIcon from "~/icons/Trash";
import UndoIcon from "~/icons/Undo";
import XIcon from "~/icons/X";

import { FILE_EXTENSIONS } from "../../constants";
import { useCanvas } from "../../hooks";
import { useActiveObject, useEventRender } from "../../hooks";
import { exportToFile, importFromFile } from "../../utils";
import styles from "./Topbar.module.scss";

// Main menu

const MainMenu = (): React.ReactElement => {
  const canvas = useCanvas();
  const toast = useToast();
  const [openFileSelector] = useFilePicker({
    readAs: "ArrayBuffer",
    accept: FILE_EXTENSIONS.map((ext) => `.${ext}`),
    multiple: false,
    limitFilesConfig: { max: 1, min: 1 },
    onFilesRejected: () => {
      toast("Unable to import the sketch file", "error");
    },
    onFilesSuccessfulySelected: ({ filesContent }) => {
      if (filesContent[0]) {
        try {
          const file = filesContent[0];
          importFromFile(canvas.current, new Uint8Array(file.content as any));
        } catch (e) {
          toast("Unable to import the sketch file", "error");
        }
      } else {
        toast("No sketch file selected", "error");
      }
    }
  });
  const [resetElement, confirmReset] = useConfirmation(
    <MenuItem
      decorator={<TrashIcon />}
      onSelect={(event): void => {
        event.preventDefault(); // Do not auto-close the menu
        confirmReset({
          color: "ruby",
          onConfirm: resetCanvas,
          title: "Reset canvas?",
          description:
            "This will remove all the layers and clear the entire canvas. Are you sure?"
        });
      }}
    >
      Reset canvas
    </MenuItem>
  );

  /**
   * File import handler
   * @param event Event
   */
  const importFile = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault(); // Do not auto-close the menu

    if (canvas.current?.getObjects()?.length) {
      confirmImport({
        color: "ruby",
        onConfirm: openFileSelector,
        title: "Overwrite canvas?",
        description:
          "Opening a new sketch file will overwrite the existing layers on the canvas. Do you want to proceed?"
      });
    } else {
      openFileSelector();
    }
  };

  const [importElement, confirmImport] = useConfirmation(
    <MenuItem
      decorator={<FolderOpenIcon />}
      /*
       * Add an on-click listener to prevent the modal from opening
       * when the menu item is clicked
       */
      onClick={importFile}
      onSelect={importFile as any}
    >
      Open
    </MenuItem>
  );

  /**
   * Saves a local copy of the canvas
   */
  const saveLocalCopy = (): void => {
    if (canvas.current) {
      exportToFile(canvas.current);
    }
  };

  /**
   * Resets the canvas
   */
  const resetCanvas = (): void => {
    if (canvas.current) {
      canvas.current.clear();
    }
  };

  return (
    <Menu
      size={"sm"}
      trigger={
        <IconButton
          aria-label={"Main menu"}
          className={clsx("focus-invert", styles.x, styles["icon-button"])}
          variant={"ghost"}
        >
          <MenuIcon />
        </IconButton>
      }
    >
      {importElement}
      <MenuItem decorator={<DownloadIcon />} onSelect={saveLocalCopy}>
        Save local copy...
      </MenuItem>
      <MenuItem decorator={<ImageIcon />}>Export image...</MenuItem>
      <Separator />
      {resetElement}
    </Menu>
  );
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
