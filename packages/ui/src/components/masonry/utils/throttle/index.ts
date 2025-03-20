type Arguments = Array<Event | string | number | boolean | null>;

export type ThrottleReturn = {
  (...args: Arguments): void;
  clearTimeout: () => void;
};

/**
 * Limits the number of times a function can be called to a
 * given threshhold
 */
export const throttle = (
  fn: (...args: Arguments) => void,
  threshhold = 100
): ThrottleReturn => {
  let last: number | void;
  let defer_timer: NodeJS.Timeout | void;

  const throttled = (...args: Arguments): void => {
    const now = Date.now();
    if (last !== undefined && now - last < threshhold) {
      clearTimeout(defer_timer!);
      defer_timer = setTimeout(
        () => {
          last = now;
          fn(...args);
        },
        threshhold - (now - (last ?? 0))
      );
    } else {
      last = now;
      fn(...args);
    }
  };

  throttled.clearTimeout = (): void => {
    if (defer_timer) {
      clearTimeout(defer_timer);
    }
  };

  return throttled;
};
