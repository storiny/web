import React from "react";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import IndentIcon from "~/icons/Indent";
import OutdentIcon from "~/icons/Outdent";

const Indentation = (): React.ReactElement => (
  <div className={"flex-center"}>
    <Tooltip content={"Indent"}>
      <IconButton variant={"ghost"}>
        <IndentIcon />
      </IconButton>
    </Tooltip>
    <Tooltip content={"Outdent"}>
      <IconButton variant={"ghost"}>
        <OutdentIcon />
      </IconButton>
    </Tooltip>
  </div>
);

export default Indentation;
