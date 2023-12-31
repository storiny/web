import React from "react";

import CodeBlockIcon from "~/icons/code-block";

import { use_insert_code_block } from "../../../../../../../hooks/use-insert-code-block";
import InsertItem from "../insert-item";

const CodeBlockItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_code_block] = use_insert_code_block();
  return (
    <InsertItem
      data-testid={"insert-code-block"}
      decorator={<CodeBlockIcon />}
      disabled={disabled}
      label={"Code block"}
      onClick={(): void => insert_code_block({})}
    />
  );
};

export default CodeBlockItem;
