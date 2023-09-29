import React from "react";

import MenubarItem from "../../../../../../../../ui/src/components/menubar-item";
import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "~/icons/Omega";

import { useInsertTextEntity } from "../../../../../../hooks/use-insert-text-entity";

const SymbolMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertSymbol] = useInsertTextEntity();
  return (
    <SymbolPicker
      on_symbol_select={insertSymbol}
      popover_props={{ modal: true }}
    >
      <MenubarItem
        decorator={<OmegaIcon />}
        disabled={disabled}
        onSelect={(event): void => event.preventDefault()}
      >
        Symbol
      </MenubarItem>
    </SymbolPicker>
  );
};

export default SymbolMenubarItem;
