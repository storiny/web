import React from "react";

import { clamp } from "~/utils/clamp";

const EXTRA_HEIGHT = 5; // Add extra height to hide the scrollbar

/**
 * Hook for automatic mutation of the height of a textarea to accomodate
 * its content
 * @param textareaRef Textarea ref
 * @param maxHeight Maximum textarea height (px)
 */
export const useTextareaAutosize =
  (
    textareaRef: React.MutableRefObject<HTMLTextAreaElement>,
    maxHeight: number = Infinity
  ) =>
  (): void => {
    // We need to reset the height momentarily to get the correct `scrollHeight` for the textarea
    textareaRef.current.style.height = "0px";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = `${clamp(
      0,
      scrollHeight + EXTRA_HEIGHT,
      maxHeight
    )}px`;
  };
