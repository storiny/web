import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

const History = (): React.ReactElement => (
  <div className={"flex-center"}>
    <Tooltip content={"Undo"}>
      <IconButton variant={"ghost"}>
        <UndoIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Redo"}>
      <IconButton variant={"ghost"}>
        <RedoIcon />
      </IconButton>
    </Tooltip>
  </div>
);

export default History;
