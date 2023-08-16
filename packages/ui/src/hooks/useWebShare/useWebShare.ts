"use client";

import { devConsole } from "@storiny/shared/src/utils/devLog";

import { webShare } from "~/utils/webShare";

/**
 * Hook to share data using the web share API
 */
export const useWebShare =
  () =>
  (
    text: string,
    url: string | null = null,
    {
      onShareStart,
      onShareEnd
    }: {
      onShareEnd?: () => void;
      onShareStart?: () => void;
    } = {}
  ) => {
    try {
      onShareStart && onShareStart();

      webShare({
        text,
        url
      }).then(() => {
        onShareEnd && onShareEnd();
      });
    } catch (e) {
      devConsole.error(e);
    }
  };
