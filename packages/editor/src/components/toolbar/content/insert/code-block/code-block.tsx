import React from "react";

import MenuItem from "~/components/menu-item";
import CodeBlockIcon from "~/icons/code-block";

import { use_insert_code_block } from "../../../../../hooks/use-insert-code-block";

const CodeBlockMenuItem = (): React.ReactElement => {
  const [insert_code_block] = use_insert_code_block();
  return (
    <MenuItem
      decorator={<CodeBlockIcon />}
      onSelect={(): void => insert_code_block({})}
    >
      Code block
    </MenuItem>
  );
};

export default CodeBlockMenuItem;
