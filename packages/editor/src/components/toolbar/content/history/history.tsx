import { clsx } from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

import { useHistory } from "../../../../hooks/use-history";
import toolbarStyles from "../../toolbar.module.scss";

const ToolbarHistoryItem = (): React.ReactElement => {
  const { undo, canUndo, canRedo, redo } = useHistory();
  return (
    <div className={"flex-center"}>
      <Tooltip content={"Undo"}>
        <IconButton
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          disabled={!canUndo}
          onClick={undo}
          size={"lg"}
          variant={"ghost"}
        >
          <UndoIcon />
        </IconButton>
      </Tooltip>
      <Tooltip content={"Redo"}>
        <IconButton
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          disabled={!canRedo}
          onClick={redo}
          size={"lg"}
          variant={"ghost"}
        >
          <RedoIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default ToolbarHistoryItem;
