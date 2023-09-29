import { CAN_USE_DOM } from "@storiny/shared/src/browsers";
import React from "react";

/**
 * `use_layout_effect` extension that can be used on the server
 */
export const use_layout_effect: typeof React.useLayoutEffect = CAN_USE_DOM
  ? React.useLayoutEffect
  : React.useEffect;
