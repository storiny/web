import React from "react";

import MenuItem from "~/components/MenuItem";
import CodeBlockIcon from "~/icons/CodeBlock";

const CodeBlockMenuItem = (): React.ReactElement => (
  <MenuItem decorator={<CodeBlockIcon />}>Code block</MenuItem>
);

export default CodeBlockMenuItem;
