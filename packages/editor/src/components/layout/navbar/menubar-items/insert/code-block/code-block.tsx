import React from "react";

import MenubarItem from "../../../../../../../../ui/src/components/menubar-item";
import CodeBlockIcon from "~/icons/CodeBlock";

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
