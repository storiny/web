import React from "react";

import { WhiteboardCoreProps } from "../whiteboard";

type WhiteboardPropsWithoutMount = Omit<WhiteboardCoreProps, "onMount">;

/**
 * Context
 */
export const WhiteboardContext =
  React.createContext<WhiteboardPropsWithoutMount>(
    {} as WhiteboardPropsWithoutMount
  );

const WhiteboardProvider = ({
  children,
  value
}: {
  children: React.ReactNode;
  value: WhiteboardPropsWithoutMount;
}): React.ReactElement => (
  <WhiteboardContext.Provider value={value}>
    {children}
  </WhiteboardContext.Provider>
);

export default WhiteboardProvider;
