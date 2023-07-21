import { Canvas } from "fabric";
import React from "react";

/**
 * Context
 */
export const FabricContext = React.createContext<
  React.MutableRefObject<Canvas>
>({} as React.MutableRefObject<Canvas>);

const FabricProvider = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <FabricContext.Provider
    value={React.createRef() as React.MutableRefObject<Canvas>}
  >
    {children}
  </FabricContext.Provider>
);

export default FabricProvider;
