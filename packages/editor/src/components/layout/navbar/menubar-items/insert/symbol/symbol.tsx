import React from "react";

import MenubarItem from "~/components/menubar-item";
import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "~/icons/omega";

import { use_insert_text_entity } from "../../../../../../hooks/use-insert-text-entity";

const SymbolMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_symbol] = use_insert_text_entity();
  return (
    <SymbolPicker
      on_symbol_select={insert_symbol}
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
