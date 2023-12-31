import React from "react";

import { ScrollerProps } from "./scroller.props";

/**
 * Scroller is a pass-through component that simply sets up an `onScroll`
 * handler on the given `scroll_container` element (or the element that is
 * returned as a result of calling the `scroll_container` method). This allows
 * for the event listener subscription of the `scroll_container` to be managed
 * inside the React lifecycle without adding bloat to Masonry or other
 * `onScroll` subscribers.
 *
 * Note that this component renders its children without creating any
 * additional content. Also note that, while the component is built to manage
 * `onScroll` inside the React lifecycle, it doesn't change `onScroll` events
 * or the API at all, so it could easily be adapted to other event types.
 */

type ScrollContainer = HTMLElement | null | undefined;

/**
 * Resolves the scroll container if provided
 * @param scroll_container Provided container
 */
const get_scroll_container = (
  scroll_container:
    | (HTMLElement | (() => HTMLElement | null | undefined))
    | null
    | undefined
): ScrollContainer =>
  typeof scroll_container === "function"
    ? scroll_container()
    : scroll_container;

export default class Scroller extends React.Component<ScrollerProps> {
  /**
   * Scroll container
   * @private
   */
  private scroll_container: ScrollContainer;

  /**
   * Getter for scroll container
   */
  get_scroll_container_ref: () => ScrollContainer = () => this.scroll_container;

  /**
   * Scroll event handler
   * @param event Scroll event
   */
  private handle_scroll: (event: Event) => void = (event: Event) => {
    this.props.on_scroll(event);
  };

  componentDidMount(): void {
    const scroll_container = get_scroll_container(this.props.scroll_container);
    if (scroll_container) {
      this.update_scroll_container(scroll_container);
    }
  }

  componentDidUpdate(): void {
    const next_scroll_container = get_scroll_container(
      this.props.scroll_container
    );

    if (
      next_scroll_container &&
      next_scroll_container !== this.scroll_container
    ) {
      this.update_scroll_container(next_scroll_container);
    }
  }

  componentWillUnmount(): void {
    if (this.scroll_container) {
      this.scroll_container.removeEventListener("scroll", this.handle_scroll);
    }
  }

  /**
   * Updates scroll container
   * @param scroll_container New scroll container
   */
  private update_scroll_container(scroll_container: HTMLElement): void {
    if (this.scroll_container) {
      // Cleanup existing attached events on the scroll container
      this.scroll_container.removeEventListener("scroll", this.handle_scroll);
    }

    // Assign a new container and attach events to it
    this.scroll_container = scroll_container;
    this.scroll_container.addEventListener("scroll", this.handle_scroll);
  }

  render(): React.ReactNode {
    // Ensure that we only ever have a single child element
    return React.Children.only(this.props.children);
  }
}
