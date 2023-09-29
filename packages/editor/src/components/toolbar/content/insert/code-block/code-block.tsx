import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import CodeBlockIcon from "~/icons/CodeBlock";

const CodeBlockMenuItem = (): React.ReactElement => (
  <MenuItem decorator={<CodeBlockIcon />} disabled>
    Code block
  </MenuItem>
);

export default CodeBlockMenuItem;
