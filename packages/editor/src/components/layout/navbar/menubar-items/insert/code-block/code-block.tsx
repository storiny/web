import React from "react";

import MenubarItem from "~/components/menubar-item";
import CodeBlockIcon from "~/icons/code-block";

const CodeBlockMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <MenubarItem decorator={<CodeBlockIcon />} disabled={disabled}>
    Code block
  </MenubarItem>
);

export default CodeBlockMenubarItem;
