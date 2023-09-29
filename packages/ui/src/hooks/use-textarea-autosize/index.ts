import React from "react";

import { clamp } from "~/utils/clamp";

/**
 * Hook for automatic mutation of the height of a textarea to accomodate
 * its content
 * @param textarea_ref Textarea ref
 * @param max_height Maximum textarea height (px)
 */
export const use_textarea_autosize =
  (
    textarea_ref: React.MutableRefObject<
      HTMLTextAreaElement | undefined | null
    >,
    max_height = Infinity
  ) =>
  (): void => {
    const { current: textarea } = textarea_ref;

    if (textarea) {
      // We need to reset the height momentarily to get the correct `scrollHeight` for the textarea
      textarea.style.height = "0px";
      let padding_y = parseFloat(
        textarea.getAttribute("data-padding-block") || ""
      );

      if (Number.isNaN(padding_y)) {
        const computed_style = getComputedStyle(textarea);
        const padding_block =
          parseFloat(computed_style.paddingTop) +
          parseFloat(computed_style.paddingBottom);

        if (!Number.isNaN(padding_block)) {
          padding_y = padding_block;
          textarea.setAttribute("data-padding-block", String(padding_block));
        } else {
          padding_y = 0;
        }
      }

      const scrollHeight = textarea.scrollHeight - padding_y;
      textarea.style.height = `${clamp(0, scrollHeight, max_height)}px`;
    }
  };
