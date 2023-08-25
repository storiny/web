import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import IndentIcon from "~/icons/Indent";
import OutdentIcon from "~/icons/Outdent";

const Indentation = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <div className={"flex-center"}>
    <Tooltip content={"Indent"}>
      <IconButton disabled={disabled} variant={"ghost"}>
        <IndentIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Outdent"}>
      <IconButton disabled={disabled} variant={"ghost"}>
        <OutdentIcon />
      </IconButton>
    </Tooltip>
  </div>
);

export default Indentation;
