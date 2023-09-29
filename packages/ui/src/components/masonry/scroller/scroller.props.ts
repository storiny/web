import React from "react";

export interface ScrollerProps {
  /**
   * Scroller content
   */
  children?: React.ReactNode;
  /**
   * Scroll event handler
   * @param event Scroll event
   */
  on_scroll: (event: Event) => void;
  /**
   * Function to render a scroll container
   */
  scroll_container:
    | (HTMLElement | null | undefined)
    | (() => HTMLElement | null | undefined);
}
