import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import HorizontalRuleIcon from "~/icons/HorizontalRule";

import { useInsertHorizontalRule } from "../../../../../hooks/use-insert-horizontal-rule";

const HorizontalRuleMenuItem = (): React.ReactElement => {
  const [insertHorizontalRule] = useInsertHorizontalRule();
  return (
    <MenuItem
      decorator={<HorizontalRuleIcon />}
      onSelect={insertHorizontalRule}
    >
      Horizontal rule
    </MenuItem>
  );
};

export default HorizontalRuleMenuItem;
