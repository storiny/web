import React from "react";

export interface ZoomProps {
  /**
   * The children for the component.
   */
  children: React.ReactNode;
  /**
   * The optional class name to apply to the dialog container.
   */
  dialog_class?: string;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    zoom_img?: React.ImgHTMLAttributes<HTMLImageElement>;
  };
  /**
   * The threshold value for unzooming through swipe gestures.
   * @default 10
   */
  swipe_to_unzoom_threshold?: number;
  /**
   * The tag name for the wrapping element, either "div" or "span".
   * @default 'div'
   */
  wrap_element?: "div" | "span";
  /**
   * The margin to apply around the zoomed element.
   */
  zoom_margin?: number;
}
