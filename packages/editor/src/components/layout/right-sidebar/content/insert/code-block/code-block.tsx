import React from "react";

import CodeBlockIcon from "~/icons/CodeBlock";

import InsertItem from "../insert-item";

const CodeBlockItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <InsertItem
    decorator={<CodeBlockIcon />}
    disabled={disabled}
    label={"Code block"}
  />
);

export default CodeBlockItem;
