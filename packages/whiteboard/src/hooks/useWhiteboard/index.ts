import React from "react";

import { WhiteboardContext } from "../../components/Context";
import { WhiteboardCoreProps } from "../../components/Main";

/**
 * Hook for consuming whiteboard props
 */
export const useWhiteboard = (): WhiteboardCoreProps =>
  React.useContext(WhiteboardContext);
