import React from "react";

import SymbolPicker from "~/entities/symbol-picker";
import OmegaIcon from "~/icons/Omega";

import { useInsertTextEntity } from "../../../../../../hooks/use-insert-text-entity";
import InsertItem from "../insert-item";

const SymbolItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertSymbol] = useInsertTextEntity();
  return (
    <SymbolPicker onSymbolSelect={insertSymbol}>
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
