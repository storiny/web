import React from "react";

import MenuItem from "~/components/menu-item";
import HorizontalRuleIcon from "~/icons/horizontal-rule";

import { use_insert_horizontal_rule } from "../../../../../hooks/use-insert-horizontal-rule";

const HorizontalRuleMenuItem = (): React.ReactElement => {
  const [insert_horizontal_rule] = use_insert_horizontal_rule();
  return (
    <MenuItem
      decorator={<HorizontalRuleIcon />}
      onSelect={insert_horizontal_rule}
    >
      Horizontal rule
    </MenuItem>
  );
};

export default HorizontalRuleMenuItem;
