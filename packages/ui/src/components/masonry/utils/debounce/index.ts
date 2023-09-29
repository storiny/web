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
  threshhold = 100
): DebounceReturn => {
  let defer_timer: NodeJS.Timeout | null = null;

  const debounced = (...args: Arguments): void => {
    if (defer_timer) {
      clearTimeout(defer_timer);
    }

    defer_timer = setTimeout(() => {
      defer_timer = null;
      fn(...args);
    }, threshhold);
  };

  debounced.clearTimeout = (): void => {
    if (defer_timer) {
      clearTimeout(defer_timer);
    }
  };

  return debounced;
};
