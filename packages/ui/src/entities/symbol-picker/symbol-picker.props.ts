import React from "react";

import { PopoverProps } from "~/components/popover";

export interface SymbolPickerProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Callback function called when selecting a symbol
   */
  on_symbol_select?: (symbol: string) => void;
  /**
   * Props passed to the Popover component
   */
  popover_props?: Partial<PopoverProps>;
}
