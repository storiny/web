import React from "react";

import MenubarItem from "~/components/menubar-item";
import CodeBlockIcon from "~/icons/code-block";
import { use_insert_code_block } from "../../../../../../hooks/use-insert-code-block";

const CodeBlockMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_code_block] = use_insert_code_block();
  return (
    <MenubarItem
      decorator={<CodeBlockIcon />}
      disabled={disabled}
      onSelect={(): void => insert_code_block({})}
    >
      Code block
    </MenubarItem>
  );
};

export default CodeBlockMenubarItem;
