import React from "react";

import MenuItem from "~/components/MenuItem";
import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "~/icons/Omega";

import { useInsertTextEntity } from "../../../../../hooks/use-insert-text-entity";

const SymbolMenuItem = (): React.ReactElement => {
  const [insertSymbol] = useInsertTextEntity();
  return (
    <SymbolPicker onSymbolSelect={insertSymbol} popoverProps={{ modal: true }}>
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
