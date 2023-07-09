import React from "react";

export interface ScrollerProps {
  /**
   * Scroller content
   */
  children?: React.ReactNode;
  /**
   * onScroll event handler
   * @param event Scroll event
   */
  onScroll: (event: Event) => void;
  /**
   * Function to render a scroll container
   */
  scrollContainer:
    | (HTMLElement | null | undefined)
    | (() => HTMLElement | null | undefined);
}
