import React from "react";

import MenubarItem from "~/components/menubar-item";
import CodeBlockIcon from "~/icons/code-block";

const CodeBlockMenubarItem = (): React.ReactElement => (
  <MenubarItem
    decorator={<CodeBlockIcon />}
    disabled
    // TODO: Uncomment once implemented
    // disabled={disabled}
  >
    Code block
  </MenubarItem>
);

export default CodeBlockMenubarItem;
