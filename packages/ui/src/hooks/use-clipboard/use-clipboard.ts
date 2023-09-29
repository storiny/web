"use client";

import { use_toast } from "src/components/toast";
import { copy_to_clipboard } from "src/utils/copy-to-clipboard";

/**
 * Hook to write text to the clipboard
 */
export const use_clipboard = (): ((
  text: string,
  {
    on_copy_start,
    on_copy_end,
    disable_toast
  }?: {
    disable_toast?: boolean;
    on_copy_end?: () => void;
    on_copy_start?: () => void;
  }
) => void) => {
  const toast = use_toast();

  return (
    text: string,
    {
      on_copy_start,
      on_copy_end,
      disable_toast
    }: {
      disable_toast?: boolean;
      on_copy_end?: () => void;
      on_copy_start?: () => void;
    } = {}
  ) => {
    try {
      on_copy_start && on_copy_start();

      copy_to_clipboard(text).then(() => {
        on_copy_end && on_copy_end();

        if (!disable_toast) {
          toast("Copied to clipboard"); // Use the `blank` severity for common action
        }
      });
    } catch {
      if (!disable_toast) {
        toast("Unable to copy", "error");
      }
    }
  };
};
