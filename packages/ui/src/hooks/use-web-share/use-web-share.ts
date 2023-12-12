"use client";

import { dev_console } from "@storiny/shared/src/utils/dev-log";

import { use_toast } from "~/components/toast";
import { web_share } from "~/utils/web-share";

/**
 * Hook to share data using the web share API
 */
export const use_web_share =
  (toaster: ReturnType<typeof use_toast>) =>
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
      }).then((is_success) => {
        on_share_end?.();

        // Clipboad fallback if the web share API is not supported by the
        // client.
        if (!is_success) {
          toaster("Copied to clipboard");
        }
      });
    } catch (e) {
      dev_console.error(e);
    }
  };
