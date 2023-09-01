import React from "react";

import { PopoverProps } from "~/components/Popover";

export interface SymbolPickerProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Callback function called when selecting a symbol
   */
  onSymbolSelect?: (symbol: string) => void;
  /**
   * Props passed to the Popover component
   */
  popoverProps?: Partial<PopoverProps>;
}
