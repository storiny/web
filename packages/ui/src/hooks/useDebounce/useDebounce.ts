import React from "react";

import { UseDebounceProps } from "./useDebounce.props";

/**
 * De-dupes and delays repeated state variable updates.
 * @param value The value to debounce
 * @param delay Timeout delay
 */
export const useDebounce: UseDebounceProps = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] =
    React.useState<typeof value>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
