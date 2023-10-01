import React from "react";

import MenuItem from "~/components/menu-item";
import CodeBlockIcon from "~/icons/code-block";

const CodeBlockMenuItem = (): React.ReactElement => (
  <MenuItem decorator={<CodeBlockIcon />} disabled>
    Code block
  </MenuItem>
);

export default CodeBlockMenuItem;
