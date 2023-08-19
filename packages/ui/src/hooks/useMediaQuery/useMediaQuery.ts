"use client";

import React from "react";

import { UseMediaQueryProps } from "./useMediaQuery.props";

/**
 * Hook for `matchMedia` browser API
 * @param query The media query to match against
 */
export const useMediaQuery = (query: UseMediaQueryProps): boolean => {
  const matchMedia =
    typeof window !== "undefined" && typeof window.matchMedia !== "undefined"
      ? window.matchMedia
      : null;
  const getDefaultSnapshot = React.useCallback(() => false, []);

  const getServerSnapshot = React.useMemo(
    () => getDefaultSnapshot,
    [getDefaultSnapshot]
  );

  const [getSnapshot, subscribe] = React.useMemo(() => {
    if (matchMedia === null) {
      return [getDefaultSnapshot, () => () => {}];
    }

    const mediaQueryList = matchMedia(query);

    return [
      (): boolean => mediaQueryList.matches,
      (handler: () => void): (() => void) => {
        // Safari < 14 does not support `addEventListener`
        if (mediaQueryList?.addEventListener) {
          mediaQueryList.addEventListener("change", handler);
        } else {
          mediaQueryList.addListener(handler);
        }

        return () => {
          if (mediaQueryList?.removeEventListener) {
            mediaQueryList.removeEventListener("change", handler);
          } else {
            mediaQueryList.removeListener(handler);
          }
        };
      }
    ];
  }, [getDefaultSnapshot, matchMedia, query]);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
