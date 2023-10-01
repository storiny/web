import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import IconButton from "~/components/icon-button";
import Tooltip from "~/components/tooltip";
import RedoIcon from "~/icons/redo";
import UndoIcon from "~/icons/undo";

import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";
import { use_history } from "../../../../../../hooks/use-history";

const History = ({ disabled }: { disabled?: boolean }): React.ReactElement => {
  const { can_redo, undo, can_undo, redo } = use_history();
  return (
    <div className={"flex-center"}>
      <Tooltip
        content={"Undo"}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.undo)}
      >
        <IconButton
          disabled={disabled || !can_undo}
          onClick={undo}
          variant={"ghost"}
        >
          <UndoIcon />
        </IconButton>
      </Tooltip>
      <Tooltip
        content={"Redo"}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.redo)}
      >
        <IconButton
          disabled={disabled || !can_redo}
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
