import React from "react";

import { KEYS } from "../../../../constants";

/**
 * Predicate function for enabling binding for pointer event
 * @param event Pointer event
 */
export const shouldEnableBindingForPointerEvent = (
  event: React.PointerEvent<HTMLElement>
): boolean => !event[KEYS.CTRL_OR_CMD];
