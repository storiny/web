import React from "react";

import HorizontalRuleIcon from "~/icons/HorizontalRule";

import { useInsertHorizontalRule } from "../../../../../../hooks/use-insert-horizontal-rule";
import InsertItem from "../insert-item";

const HorizontalRuleItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertHorizontalRule] = useInsertHorizontalRule();
  return (
    <InsertItem
      data-testid={"insert-hr"}
      decorator={<HorizontalRuleIcon />}
      disabled={disabled}
      label={"Horizontal rule"}
      onClick={insertHorizontalRule}
    />
  );
};

export default HorizontalRuleItem;
