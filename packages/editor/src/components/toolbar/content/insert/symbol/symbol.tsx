import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "../../../../../../../ui/src/icons/omega";

import { use_insert_text_entity } from "../../../../../hooks/use-insert-text-entity";

const SymbolMenuItem = (): React.ReactElement => {
  const [insert_symbol] = use_insert_text_entity();
  return (
    <SymbolPicker
      on_symbol_select={insert_symbol}
      popover_props={{ modal: true }}
    >
      <MenuItem
        decorator={<OmegaIcon />}
        onSelect={(event): void => event.preventDefault()}
      >
        Symbol
      </MenuItem>
    </SymbolPicker>
  );
};

export default SymbolMenuItem;
