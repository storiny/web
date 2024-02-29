"use client";

import React from "react";

/**
 * Resets the state to its initial value on mount. Used during dynamic navigation.
 * @param initial_value The initial value of the state.
 * @param dispatch The state dispatcher.
 */
export const use_handle_dynamic_state = <T>(
  initial_value: T,
  dispatch: React.Dispatch<React.SetStateAction<T>>
): void => {
  const mounted_ref = React.useRef(false);

  // Reset page on unmount
  React.useEffect(() => {
    // Do not run on the first mount.
    if (!mounted_ref.current) {
      mounted_ref.current = true;
    } else {
      dispatch(initial_value);
    }
  }, [dispatch, initial_value]);
};
