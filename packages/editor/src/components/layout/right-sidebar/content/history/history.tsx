import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

const History = ({ disabled }: { disabled?: boolean }): React.ReactElement => (
  <div className={"flex-center"}>
    <Tooltip content={"Undo"}>
      <IconButton disabled={disabled} variant={"ghost"}>
        <UndoIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Redo"}>
      <IconButton disabled={disabled} variant={"ghost"}>
        <RedoIcon />
      </IconButton>
    </Tooltip>
  </div>
);

export default History;
