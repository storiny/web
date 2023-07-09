type Arguments = Array<Event | string | number | boolean | null>;
export type DebounceReturn = {
  (...args: Arguments): void;
  clearTimeout: () => void;
};

/**
 * Prevents a particular function from being called until after a given
 * cooldown period
 */
export const debounce = (
  fn: (...args: Arguments) => void,
  threshhold: number = 100
): DebounceReturn => {
  let deferTimer: NodeJS.Timeout | null = null;

  const debounced = (...args: Arguments): void => {
    if (deferTimer) {
      clearTimeout(deferTimer);
    }

    deferTimer = setTimeout(() => {
      deferTimer = null;
      fn(...args);
    }, threshhold);
  };

  debounced.clearTimeout = (): void => {
    if (deferTimer) {
      clearTimeout(deferTimer);
    }
  };

  return debounced;
};
