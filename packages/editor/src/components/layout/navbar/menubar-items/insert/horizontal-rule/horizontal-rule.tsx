import React from "react";

import MenubarItem from "~/components/menubar-item";
import HorizontalRuleIcon from "~/icons/horizontal-rule";

import { use_insert_horizontal_rule } from "../../../../../../hooks/use-insert-horizontal-rule";

const HorizontalRuleMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_horizontal_rule] = use_insert_horizontal_rule();
  return (
    <MenubarItem
      decorator={<HorizontalRuleIcon />}
      disabled={disabled}
      onSelect={insert_horizontal_rule}
    >
      Horizontal rule
    </MenubarItem>
  );
};

export default HorizontalRuleMenubarItem;
