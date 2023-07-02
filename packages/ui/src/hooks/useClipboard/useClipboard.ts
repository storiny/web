"use client";

import { useToast } from "~/components/Toast";
import { copyToClipboard } from "~/utils/copyToClipboard";

/**
 * Hook to write text to the clipboard
 */
export const useClipboard = (): ((
  text: string,
  {
    onCopyStart,
    onCopyEnd,
    disableToast
  }?: {
    disableToast?: boolean;
    onCopyEnd?: () => void;
    onCopyStart?: () => void;
  }
) => void) => {
  const toast = useToast();

  return (
    text: string,
    {
      onCopyStart,
      onCopyEnd,
      disableToast
    }: {
      disableToast?: boolean;
      onCopyEnd?: () => void;
      onCopyStart?: () => void;
    } = {}
  ) => {
    try {
      onCopyStart && onCopyStart();

      copyToClipboard(text).then(() => {
        onCopyEnd && onCopyEnd();

        if (!disableToast) {
          toast("Copied to clipboard");
        }
      });
    } catch (e) {
      if (!disableToast) {
        toast("Unable to copy", "error");
      }
    }
  };
};
