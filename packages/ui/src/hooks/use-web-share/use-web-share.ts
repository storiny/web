"use client";

import { dev_console } from "@storiny/shared/src/utils/dev-log";

import { web_share } from "src/utils/web-share";

/**
 * Hook to share data using the web share API
 */
export const use_web_share =
  () =>
  (
    text: string,
    url: string | null = null,
    {
      on_share_start,
      on_share_end
    }: {
      on_share_end?: () => void;
      on_share_start?: () => void;
    } = {}
  ): void => {
    try {
      on_share_start?.();
      web_share({
        text,
        url
      }).then(() => {
        on_share_end?.();
      });
    } catch (e) {
      dev_console.error(e);
    }
  };
