import React from "react";

import { WhiteboardContext } from "../../components/context";
import { WhiteboardCoreProps } from "../../components/whiteboard";

/**
 * Hook for consuming whiteboard props
 */
export const use_whiteboard = (): WhiteboardCoreProps =>
  React.useContext(WhiteboardContext);
