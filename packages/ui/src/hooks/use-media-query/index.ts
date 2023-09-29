"use client";

import React from "react";

/**
 * Hook for `matchMedia` browser API
 * @param query The media query to match against
 */
export const use_media_query = (query: string): boolean => {
  const matchMedia =
    typeof window !== "undefined" && typeof window.matchMedia !== "undefined"
      ? window.matchMedia
      : null;
  const get_default_snapshot = React.useCallback(() => false, []);
  const get_server_snapshot = React.useMemo(
    () => get_default_snapshot,
    [get_default_snapshot]
  );

  const [get_snapshot, subscribe] = React.useMemo(() => {
    if (matchMedia === null) {
      return [get_default_snapshot, () => () => undefined];
    }

    const mq_list = matchMedia(query);

    return [
      (): boolean => mq_list.matches,
      (handler: () => void): (() => void) => {
        // Safari < 14 does not support `addEventListener`
        if (mq_list?.addEventListener) {
          mq_list.addEventListener("change", handler);
        } else {
          mq_list.addListener(handler);
        }

        return () => {
          if (mq_list?.removeEventListener) {
            mq_list.removeEventListener("change", handler);
          } else {
            mq_list.removeListener(handler);
          }
        };
      }
    ];
  }, [get_default_snapshot, matchMedia, query]);

  return React.useSyncExternalStore(
    subscribe,
    get_snapshot,
    get_server_snapshot
  );
};
