import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import IconButton from "~/components/icon-button";
import Tooltip from "~/components/tooltip";
import RedoIcon from "~/icons/redo";
import UndoIcon from "~/icons/undo";
import css from "~/theme/main.module.scss";

import { doc_status_atom } from "../../../../atoms";
import { use_history } from "../../../../hooks/use-history";
import { is_doc_loading } from "../../../../utils/is-doc-loading";
import toolbar_styles from "../../toolbar.module.scss";

const ToolbarHistoryItem = (): React.ReactElement => {
  const { undo, can_undo, can_redo, redo } = use_history();
  const doc_status = use_atom_value(doc_status_atom);
  const document_loading = is_doc_loading(doc_status);

  return (
    <div className={css["flex-center"]}>
      <Tooltip content={"Undo"}>
        <IconButton
          className={clsx(
            css["focus-invert"],
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
            css["focus-invert"],
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
