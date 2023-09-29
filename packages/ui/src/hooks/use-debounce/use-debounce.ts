import React from "react";

/**
 * De-dupes and delays repeated state variable updates.
 * @param value Value to debounce
 * @param delay Timeout delay (in ms)
 */
export const use_debounce = <T>(value: T, delay = 500): T => {
  const [debounced_value, set_debounced_value] =
    React.useState<typeof value>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => set_debounced_value(value), delay);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced_value;
};
