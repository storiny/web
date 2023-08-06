import React from "react";

import { WhiteboardCoreProps } from "../Main";

/**
 * Context
 */
export const WhiteboardContext = React.createContext<WhiteboardCoreProps>(
  {} as WhiteboardCoreProps
);

const WhiteboardProvider = ({
  children,
  value
}: {
  children: React.ReactNode;
  value: WhiteboardCoreProps;
}): React.ReactElement => (
  <WhiteboardContext.Provider value={value}>
    {children}
  </WhiteboardContext.Provider>
);

export default WhiteboardProvider;
