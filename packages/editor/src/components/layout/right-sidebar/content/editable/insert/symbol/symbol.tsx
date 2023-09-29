import React from "react";

import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "../../../../../../../../../ui/src/icons/omega";

import { use_insert_text_entity } from "../../../../../../../hooks/use-insert-text-entity";
import InsertItem from "../insert-item";

const SymbolItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_symbol] = use_insert_text_entity();
  return (
    <SymbolPicker on_symbol_select={insert_symbol}>
      <InsertItem
        data-testid={"insert-symbol"}
        decorator={<OmegaIcon />}
        disabled={disabled}
        label={"Symbol"}
      />
    </SymbolPicker>
  );
};

export default SymbolItem;
