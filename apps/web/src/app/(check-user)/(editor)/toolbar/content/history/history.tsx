import { clsx } from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

import toolbarStyles from "../../toolbar.module.scss";

const ToolbarHistoryItem = (): React.ReactElement => (
  <div className={"flex-center"}>
    <Tooltip content={"Undo"}>
      <IconButton
        className={clsx(toolbarStyles.x, toolbarStyles.button)}
        size={"lg"}
        variant={"ghost"}
      >
        <UndoIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Redo"}>
      <IconButton
        className={clsx(toolbarStyles.x, toolbarStyles.button)}
        size={"lg"}
        variant={"ghost"}
      >
        <RedoIcon />
      </IconButton>
    </Tooltip>
  </div>
);

export default ToolbarHistoryItem;
