import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import IconButton from "../../../../../../ui/src/components/icon-button";
import Tooltip from "../../../../../../ui/src/components/tooltip";
import RedoIcon from "../../../../../../ui/src/icons/redo";
import UndoIcon from "../../../../../../ui/src/icons/undo";

import { doc_status_atom } from "../../../../atoms";
import { use_history } from "../../../../hooks/use-history";
import toolbar_styles from "../../toolbar.module.scss";

const ToolbarHistoryItem = (): React.ReactElement => {
  const { undo, can_undo, can_redo, redo } = use_history();
  const doc_status = use_atom_value(doc_status_atom);
  const document_loading = ["connecting", "reconnecting"].includes(doc_status);

  return (
    <div className={"flex-center"}>
      <Tooltip content={"Undo"}>
        <IconButton
          className={clsx(
            "focus-invert",
            toolbar_styles.x,
            toolbar_styles.button
          )}
          disabled={document_loading || !can_undo}
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
            toolbar_styles.x,
            toolbar_styles.button
          )}
          disabled={document_loading || !can_redo}
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
