import { CAN_USE_DOM } from "@storiny/shared/src/browsers";
import React from "react";

/**
 * `useLayoutEffect` extension that can be used on the server
 */
export const useLayoutEffect: typeof React.useLayoutEffect = CAN_USE_DOM
  ? React.useLayoutEffect
  : React.useEffect;
