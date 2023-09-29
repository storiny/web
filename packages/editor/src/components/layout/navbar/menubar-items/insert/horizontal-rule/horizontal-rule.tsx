import React from "react";

import MenubarItem from "../../../../../../../../ui/src/components/menubar-item";
import HorizontalRuleIcon from "~/icons/HorizontalRule";

import { useInsertHorizontalRule } from "../../../../../../hooks/use-insert-horizontal-rule";

const HorizontalRuleMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertHorizontalRule] = useInsertHorizontalRule();
  return (
    <MenubarItem
      decorator={<HorizontalRuleIcon />}
      disabled={disabled}
      onSelect={insertHorizontalRule}
    >
      Horizontal rule
    </MenubarItem>
  );
};

export default HorizontalRuleMenubarItem;
