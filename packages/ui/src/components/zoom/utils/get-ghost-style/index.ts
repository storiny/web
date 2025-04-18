import React from "react";

import { SupportedZoomImage } from "~/components/zoom/types";

/**
 * Returns the dimensions and position of an image element as a CSS style object.
 * @param img_element The image element to extract style from.
 */
export const get_ghost_style = (
  img_element: SupportedZoomImage | null
): React.CSSProperties => {
  if (!img_element) {
    return {};
  }

  return {
    height: img_element.offsetHeight,
    left: img_element.offsetLeft,
    width: img_element.offsetWidth,
    top: img_element.offsetTop
  };
};
