import React from "react";

import Tooltip from "~/components/Tooltip";
import CodeBlockIcon from "~/icons/CodeBlock";

import InsertItem from "../insert-item";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CodeBlockItem = (_: { disabled?: boolean }): React.ReactElement => (
  <Tooltip content={"Available soon"}>
    <div>
      <InsertItem decorator={<CodeBlockIcon />} disabled label={"Code block"} />
    </div>
  </Tooltip>
);

export default CodeBlockItem;
