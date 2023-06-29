"use client";

import React from "react";

const threshold = 100; // 100 pixels
const target = typeof window !== "undefined" ? window : null;

const getTrigger = (store: React.MutableRefObject<number>): boolean => {
  const previous = store.current;

  if (target) {
    // Get vertical scroll
    store.current =
      target.pageYOffset !== undefined ? target.pageYOffset : target.scrollY;
  }

  if (previous !== undefined && store.current < previous) {
    return false;
  }

  return store.current > threshold;
};

/**
 * Predicate function based on the relative scroll position.
 */
export const useScrollTrigger = (): boolean => {
  const store = React.useRef<number>(0);
  const [trigger, setTrigger] = React.useState<boolean>(() =>
    getTrigger(store)
  );

  React.useEffect(() => {
    const handleScroll = (): void => {
      setTrigger(getTrigger(store));
    };

    handleScroll(); // Re-evaluate trigger when dependencies change
    target?.addEventListener?.("scroll", handleScroll, { passive: true });
    return () => {
      target?.removeEventListener?.("scroll", handleScroll, {
        passive: true,
      } as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, getTrigger]);

  return trigger;
};
