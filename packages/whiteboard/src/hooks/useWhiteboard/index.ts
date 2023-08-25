import React from "react";

import { WhiteboardContext } from "../../components/context";
import { WhiteboardCoreProps } from "../../components/whiteboard";

/**
 * Hook for consuming whiteboard props
 */
export const useWhiteboard = (): WhiteboardCoreProps =>
  React.useContext(WhiteboardContext);
