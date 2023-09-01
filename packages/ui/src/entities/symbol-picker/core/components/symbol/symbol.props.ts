import React from "react";

import { TSymbol } from "../../types";

export interface SymbolProps extends React.ComponentPropsWithoutRef<"button"> {
  /**
   * The symbol object
   */
  symbol: TSymbol;
}
