import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import IconButton from "~/components/icon-button";
import Tooltip from "~/components/tooltip";
import IndentIcon from "~/icons/indent";
import OutdentIcon from "~/icons/outdent";
import css from "~/theme/main.module.scss";

import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";
import { use_indentation } from "../../../../../../hooks/use-indentation";

const Indentation = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const { indent, outdent, can_indent, can_outdent } = use_indentation();
  return (
    <div className={css["flex-center"]}>
      <Tooltip
        content={"Indent"}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.indent)}
      >
        <IconButton
          data-testid={"indent"}
          disabled={disabled || !can_indent}
          onClick={indent}
          variant={"ghost"}
        >
          <IndentIcon />
        </IconButton>
      </Tooltip>
      <Tooltip
        content={"Outdent"}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.outdent)}
      >
        <IconButton
          data-testid={"outdent"}
          disabled={disabled || !can_outdent}
          onClick={outdent}
          variant={"ghost"}
        >
          <OutdentIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default Indentation;
