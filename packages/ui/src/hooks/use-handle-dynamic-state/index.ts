"use client";

import { usePathname as use_pathname } from "next/navigation";
import React from "react";

/**
 * Resets the state to its initial value on navigation.
 * @param initial_value The initial value of the state.
 * @param dispatch The state dispatcher.
 */
export const use_handle_dynamic_state = <T>(
  initial_value: T,
  dispatch: React.Dispatch<React.SetStateAction<T>>
): void => {
  const pathname = use_pathname();

  React.useEffect(() => {
    dispatch(initial_value);
  }, [dispatch, initial_value, pathname]);
};
