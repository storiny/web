import React from "react";

import HorizontalRuleIcon from "../../../../../../../../../ui/src/icons/horizontal-rule";

import { use_insert_horizontal_rule } from "../../../../../../../hooks/use-insert-horizontal-rule";
import InsertItem from "../insert-item";

const HorizontalRuleItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_horizontal_rule] = use_insert_horizontal_rule();
  return (
    <InsertItem
      data-testid={"insert-hr"}
      decorator={<HorizontalRuleIcon />}
      disabled={disabled}
      label={"Horizontal rule"}
      onClick={insert_horizontal_rule}
    />
  );
};

export default HorizontalRuleItem;
