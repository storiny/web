import React from "react";

import MenubarItem from "~/components/MenubarItem";
import CodeBlockIcon from "~/icons/CodeBlock";

const CodeBlockMenubarItem = (): React.ReactElement => (
  <MenubarItem decorator={<CodeBlockIcon />}>Code block</MenubarItem>
);

export default CodeBlockMenubarItem;
