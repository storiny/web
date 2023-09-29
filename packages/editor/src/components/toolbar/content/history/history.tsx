import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import IconButton from "../../../../../../ui/src/components/icon-button";
import Tooltip from "../../../../../../ui/src/components/tooltip";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

import { docStatusAtom } from "../../../../atoms";
import { useHistory } from "../../../../hooks/use-history";
import toolbarStyles from "../../toolbar.module.scss";

const ToolbarHistoryItem = (): React.ReactElement => {
  const { undo, canUndo, canRedo, redo } = useHistory();
  const docStatus = use_atom_value(docStatusAtom);
  const documentLoading = ["connecting", "reconnecting"].includes(docStatus);

  return (
    <div className={"flex-center"}>
      <Tooltip content={"Undo"}>
        <IconButton
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          disabled={documentLoading || !canUndo}
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
          disabled={documentLoading || !canRedo}
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
