import React from "react";

import Tooltip from "~/components/tooltip";
import CodeBlockIcon from "~/icons/code-block";

import InsertItem from "../insert-item";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CodeBlockItem = (_: { disabled?: boolean }): React.ReactElement => (
  <Tooltip content={"Available soon"}>
    <div>
      <InsertItem
        data-testid={"insert-code-block"}
        decorator={<CodeBlockIcon />}
        disabled
        label={"Code block"}
      />
    </div>
  </Tooltip>
);

export default CodeBlockItem;
