import React from "react";

import { clamp } from "~/utils/clamp";

/**
 * Hook for automatic mutation of the height of a textarea to accomodate
 * its content
 * @param textareaRef Textarea ref
 * @param maxHeight Maximum textarea height (px)
 */
export const useTextareaAutosize =
  (
    textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined | null>,
    maxHeight: number = Infinity
  ) =>
  (): void => {
    const { current: textarea } = textareaRef;
    if (textarea) {
      // We need to reset the height momentarily to get the correct `scrollHeight` for the textarea
      textarea.style.height = "0px";
      let paddingY = parseFloat(
        textarea.getAttribute("data-padding-block") || ""
      );

      if (Number.isNaN(paddingY)) {
        const computedStyle = getComputedStyle(textarea);
        const paddingBlock =
          parseFloat(computedStyle.paddingTop) +
          parseFloat(computedStyle.paddingBottom);

        if (!Number.isNaN(paddingBlock)) {
          paddingY = paddingBlock;
          textarea.setAttribute("data-padding-block", String(paddingBlock));
        } else {
          paddingY = 0;
        }
      }

      const scrollHeight = textarea.scrollHeight - paddingY;
      textarea.style.height = `${clamp(0, scrollHeight, maxHeight)}px`;
    }
  };
