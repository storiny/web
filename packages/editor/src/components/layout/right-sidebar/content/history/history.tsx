import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useHistory } from "../../../../../hooks/useHistory";

const History = ({ disabled }: { disabled?: boolean }): React.ReactElement => {
  const { canUndo, undo, canRedo, redo } = useHistory();
  return (
    <div className={"flex-center"}>
      <Tooltip
        content={"Undo"}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.undo)}
      >
        <IconButton
          disabled={disabled || !canUndo}
          onClick={undo}
          variant={"ghost"}
        >
          <UndoIcon />
        </IconButton>
      </Tooltip>
      <Tooltip
        content={"Redo"}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.redo)}
      >
        <IconButton
          disabled={disabled || !canRedo}
          onClick={redo}
          variant={"ghost"}
        >
          <RedoIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default History;
