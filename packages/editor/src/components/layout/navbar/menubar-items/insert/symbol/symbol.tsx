import React from "react";

import MenubarItem from "~/components/MenubarItem";
import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "~/icons/Omega";

import { useInsertTextEntity } from "../../../../../../hooks/use-insert-text-entity";

const SymbolMenubarItem = (): React.ReactElement => {
  const [insertSymbol] = useInsertTextEntity();
  return (
    <SymbolPicker onSymbolSelect={insertSymbol} popoverProps={{ modal: true }}>
      <MenubarItem
        decorator={<OmegaIcon />}
        onSelect={(event): void => event.preventDefault()}
      >
        Symbol
      </MenubarItem>
    </SymbolPicker>
  );
};

export default SymbolMenubarItem;
