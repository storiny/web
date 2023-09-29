import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "~/icons/Omega";

import { useInsertTextEntity } from "../../../../../hooks/use-insert-text-entity";

const SymbolMenuItem = (): React.ReactElement => {
  const [insertSymbol] = useInsertTextEntity();
  return (
    <SymbolPicker
      on_symbol_select={insertSymbol}
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
