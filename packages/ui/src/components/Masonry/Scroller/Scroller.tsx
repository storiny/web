import React from "react";

import { ScrollerProps } from "./Scroller.props";

/**
 * Scroller is a pass-through component that simply sets up an `onScroll`
 * handler on the given `scrollContainer` element (or the element that is
 * returned as a result of calling the `scrollContainer` method). This allows for
 * the event listener subscription of the `scrollContainer` to be managed inside
 * the React lifecycle without adding bloat to Masonry or other `onScroll`
 * subscribers.
 *
 * Note that this component renders its children without creating any
 * additional content. Also note that, while the component is built to manage
 * `onScroll` inside the React lifecycle, it doesn't change `onScroll` events
 * or the API at all, so it could easily be adapted to other event types.
 */

type ScrollContainer = HTMLElement | null | undefined;

/**
 * Resolves the scroll container if provided
 * @param scrollContainer Provided container
 */
const getScrollContainer = (
  scrollContainer:
    | (HTMLElement | (() => HTMLElement | null | undefined))
    | null
    | undefined
): ScrollContainer =>
  typeof scrollContainer === "function" ? scrollContainer() : scrollContainer;

export default class Scroller extends React.Component<ScrollerProps> {
  scrollContainer: ScrollContainer;

  componentDidMount(): void {
    const scrollContainer = getScrollContainer(this.props.scrollContainer);
    if (scrollContainer) {
      this.updateScrollContainer(scrollContainer);
    }
  }

  componentDidUpdate(): void {
    const nextScrollContainer = getScrollContainer(this.props.scrollContainer);
    if (nextScrollContainer && nextScrollContainer !== this.scrollContainer) {
      this.updateScrollContainer(nextScrollContainer);
    }
  }

  componentWillUnmount(): void {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener("scroll", this.handleScroll);
    }
  }

  /**
   * Getter for scroll container
   */
  getScrollContainerRef: () => ScrollContainer = () => this.scrollContainer;

  /**
   * Scroll event handler
   * @param event Scroll event
   */
  handleScroll: (event: Event) => void = (event: Event) => {
    this.props.onScroll(event);
  };

  /**
   * Updates scroll container
   * @param scrollContainer New scroll container
   */
  updateScrollContainer(scrollContainer: HTMLElement): void {
    if (this.scrollContainer) {
      // Cleanup existing attached events on the scroll container
      this.scrollContainer.removeEventListener("scroll", this.handleScroll);
    }

    // Assign a new container and attach events to it
    this.scrollContainer = scrollContainer;
    this.scrollContainer.addEventListener("scroll", this.handleScroll);
  }

  render(): React.ReactNode {
    // Ensure that we only ever have a single child element
    return React.Children.only(this.props.children);
  }
}
