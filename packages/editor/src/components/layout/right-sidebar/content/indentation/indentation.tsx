import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import IndentIcon from "~/icons/Indent";
import OutdentIcon from "~/icons/Outdent";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useIndentation } from "../../../../../hooks/use-indentation";

const Indentation = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const { indent, outdent, canIndent, canOutdent } = useIndentation();
  return (
    <div className={"flex-center"}>
      <Tooltip
        content={"Indent"}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.indent)}
      >
        <IconButton
          disabled={disabled || !canIndent}
          onClick={indent}
          variant={"ghost"}
        >
          <IndentIcon />
        </IconButton>
      </Tooltip>
      <Tooltip
        content={"Outdent"}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.outdent)}
      >
        <IconButton
          disabled={disabled || !canOutdent}
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
