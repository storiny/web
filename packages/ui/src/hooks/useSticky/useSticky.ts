"use client";

import { dev_console } from "@storiny/shared/src/utils/devLog";
import React from "react";

import { UseStickyProps } from "./useSticky.props";

/**
 * Original implementation: https://github.com/codecks-io/react-sticky-box
 */

const enum Mode {
  STICKY_TOP /*   */ = 1,
  STICKY_BOTTOM /**/ = 2,
  RELATIVE /*     */ = 3,
  SMALL /*        */ = 4
}

type StickyMode = null | (typeof Mode)[keyof typeof Mode];
type UnsubscribeList = (() => void)[];
type MeasureFn<T extends object> = (options: {
  height: number;
  left: number;
  top: number;
  width: number;
}) => T;

type ResizeObserverCallback = (
  entries: ResizeObserverEntry[],
  observer: ResizeObserver
) => void;

// Either the regular `sticky` prop or with the webkit vendor prefix
let stickyProp: null | string = null;

if (typeof CSS !== "undefined" && CSS.supports) {
  if (CSS.supports("position", "sticky")) {
    stickyProp = "sticky";
  } else if (CSS.supports("position", "-webkit-sticky")) {
    stickyProp = "-webkit-sticky";
  }
}

// Inspired by https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
let passiveArg: false | { passive: true } = false;

try {
  const options = Object.defineProperty({}, "passive", {
    // eslint-disable-next-line getter-return
    get: (): void => {
      passiveArg = { passive: true };
    }
  });

  window.addEventListener("testPassive", () => {}, options);
  window.removeEventListener("testPassive", () => {}, options);
} catch (e) {
  dev_console.error(e);
}

/**
 * Returns a node's scroll parent
 * @param node Child node
 */
const getScrollParent = (node: HTMLElement): Window | HTMLElement => {
  let parent: HTMLElement | null = node;
  while ((parent = parent.parentElement)) {
    const overflowYVal = getComputedStyle(parent, null).getPropertyValue(
      "overflow-y"
    );

    if (parent === document.body) {
      return window;
    }

    if (
      overflowYVal === "auto" ||
      overflowYVal === "scroll" ||
      overflowYVal === "overlay"
    ) {
      return parent;
    }
  }

  return window;
};

/**
 * Predicate function for determining offset elements
 * @param element Element
 */
const isOffsetElement = (element: HTMLElement): boolean =>
  element.firstChild
    ? (element.firstChild as HTMLElement).offsetParent === element
    : true;

/**
 * Computes the offset length
 * @param node Node
 * @param target Target element
 */
const offsetTill = (node: HTMLElement, target: HTMLElement): number => {
  let current: HTMLElement = node;
  let offset = 0;

  // If target is not an `offsetParent` itself, subtract its `offsetTop` and set the correct target
  if (!isOffsetElement(target)) {
    offset += node.offsetTop - target.offsetTop;
    target = node.offsetParent as HTMLElement;
    offset += -node.offsetTop;
  }

  do {
    offset += current.offsetTop;
    current = current.offsetParent as HTMLElement;
  } while (current && current !== target);

  return offset;
};

/**
 * Returns a node's parent node
 * @param node Child node
 */
const getParentNode = (node: HTMLElement): HTMLElement | Window => {
  let currentParent = node.parentElement;

  while (currentParent) {
    const style = getComputedStyle(currentParent, null);

    if (style.getPropertyValue("display") !== "contents") {
      break;
    }

    currentParent = currentParent.parentElement;
  }

  return currentParent || window;
};

/**
 * Computes dimensions
 * @param options Options
 */
const getDimensions = <T extends object>(options: {
  element: HTMLElement | Window;
  measure: MeasureFn<T>;
  onChange: () => void;
  unsubscribes: UnsubscribeList;
}): T => {
  const { element, onChange, unsubscribes, measure } = options;

  if (element === window) {
    const getRect = (): {
      height: number;
      left: number;
      top: number;
      width: number;
    } => ({
      top: 0,
      left: 0,
      height: window.innerHeight,
      width: window.innerWidth
    });

    const measured = measure(getRect());
    const handler = (): void => {
      Object.assign(measured, measure(getRect()));
      onChange();
    };

    window.addEventListener("resize", handler, passiveArg);
    unsubscribes.push(() => window.removeEventListener("resize", handler));
    return measured;
  } else {
    const measured = measure((element as HTMLElement).getBoundingClientRect());
    const handler: ResizeObserverCallback = () => {
      // Note the e[0].contentRect is different from `getBoundingClientRect`
      Object.assign(
        measured,
        measure((element as HTMLElement).getBoundingClientRect())
      );
      onChange();
    };

    const observer = new ResizeObserver(handler);
    observer.observe(element as HTMLElement);
    unsubscribes.push(() => observer.disconnect());
    return measured;
  }
};

/**
 * Computes vertical (block) padding
 * @param node Element
 */
const getVerticalPadding = (
  node: HTMLElement
): { bottom: number; top: number } => {
  const computedParentStyle = getComputedStyle(node, null);
  const parentPaddingTop = parseInt(
    computedParentStyle.getPropertyValue("padding-top"),
    10
  );
  const parentPaddingBottom = parseInt(
    computedParentStyle.getPropertyValue("padding-bottom"),
    10
  );

  return { top: parentPaddingTop, bottom: parentPaddingBottom };
};

/**
 * Sets up the scroller and events
 * @param node Element
 * @param unsubscribes Unsubscribe list
 * @param options Options
 */
const setup = (
  node: HTMLElement,
  unsubscribes: UnsubscribeList,
  options: Required<UseStickyProps>
): void => {
  const { bottom, offsetBottom, offsetTop } = options;
  const scrollPane: Window | HTMLElement = getScrollParent(node);
  let isScheduled = false;

  const scheduleOnLayout = (): void => {
    if (!isScheduled) {
      requestAnimationFrame(() => {
        const nextMode = onLayout();
        if (nextMode !== mode) changeMode(nextMode);
        isScheduled = false;
      });
    }

    isScheduled = true;
  };

  let latestScrollY =
    scrollPane === window
      ? window.scrollY
      : (scrollPane as HTMLElement).scrollTop;

  const isContainerTooLow = (scrollY: number): boolean => {
    const { offsetTop: scrollPaneOffset, height: viewPortHeight } =
      scrollPaneDims;
    const { naturalTop } = parentDims;
    const { height: nodeHeight } = nodeDims;

    return (
      scrollY + scrollPaneOffset + viewPortHeight >=
      naturalTop + nodeHeight + relativeOffset + offsetBottom
    );
  };

  const onLayout = (): StickyMode => {
    const { height: viewPortHeight } = scrollPaneDims;
    const { height: nodeHeight } = nodeDims;
    if (nodeHeight + offsetTop + offsetBottom <= viewPortHeight) {
      return Mode.SMALL;
    } else {
      if (isContainerTooLow(latestScrollY)) {
        return Mode.STICKY_BOTTOM;
      } else {
        return Mode.RELATIVE;
      }
    }
  };

  const scrollPaneIsOffsetEl =
    scrollPane !== window && isOffsetElement(scrollPane as HTMLElement);
  const scrollPaneDims = getDimensions({
    element: scrollPane,
    onChange: scheduleOnLayout,
    unsubscribes,
    measure: ({ height, top }) => ({
      height,
      offsetTop: scrollPaneIsOffsetEl ? top : 0
    })
  });

  const parentNode = getParentNode(node);
  const parentPaddings =
    parentNode === window
      ? { top: 0, bottom: 0 }
      : getVerticalPadding(parentNode as HTMLElement);
  const parentDims = getDimensions({
    element: parentNode,
    onChange: scheduleOnLayout,
    unsubscribes,
    measure: ({ height }) => ({
      height: height - parentPaddings.top - parentPaddings.bottom,
      naturalTop:
        parentNode === window
          ? 0
          : offsetTill(parentNode as HTMLElement, scrollPane as HTMLElement) +
            parentPaddings.top +
            scrollPaneDims.offsetTop
    })
  });

  const nodeDims = getDimensions({
    element: node,
    onChange: scheduleOnLayout,
    unsubscribes,
    measure: ({ height }) => ({ height })
  });

  let relativeOffset = 0;
  let mode: Mode | null = onLayout();

  const changeMode = (newMode: StickyMode): void => {
    const prevMode = mode;
    mode = newMode;

    if (prevMode === Mode.RELATIVE) {
      relativeOffset = -1;
    }

    if (newMode === Mode.SMALL) {
      node.style.position = stickyProp as string;
      if (bottom) {
        node.style.bottom = `${offsetBottom}px`;
      } else {
        node.style.top = `${offsetTop}px`;
      }

      return;
    }

    const { height: viewPortHeight, offsetTop: scrollPaneOffset } =
      scrollPaneDims;
    const { height: parentHeight, naturalTop } = parentDims;
    const { height: nodeHeight } = nodeDims;
    if (newMode === Mode.RELATIVE) {
      node.style.position = "relative";
      relativeOffset =
        prevMode === Mode.STICKY_TOP
          ? Math.max(
              0,
              scrollPaneOffset + latestScrollY - naturalTop + offsetTop
            )
          : Math.max(
              0,
              scrollPaneOffset +
                latestScrollY +
                viewPortHeight -
                (naturalTop + nodeHeight + offsetBottom)
            );

      if (bottom) {
        const nextBottom = Math.max(
          0,
          parentHeight - nodeHeight - relativeOffset
        );
        node.style.bottom = `${nextBottom}px`;
      } else {
        node.style.top = `${relativeOffset}px`;
      }
    } else {
      node.style.position = stickyProp as string;
      if (newMode === Mode.STICKY_BOTTOM) {
        if (bottom) {
          node.style.bottom = `${offsetBottom}px`;
        } else {
          node.style.top = `${viewPortHeight - nodeHeight - offsetBottom}px`;
        }
      } else {
        // STICKY_TOP
        if (bottom) {
          node.style.bottom = `${viewPortHeight - nodeHeight - offsetBottom}px`;
        } else {
          node.style.top = `${offsetTop}px`;
        }
      }
    }
  };

  changeMode(mode);

  const onScroll = (scrollY: number): void => {
    if (scrollY === latestScrollY) {
      return;
    }

    const scrollDelta = scrollY - latestScrollY;
    latestScrollY = scrollY;

    if (mode === Mode.SMALL) {
      return;
    }

    const { offsetTop: scrollPaneOffset, height: viewPortHeight } =
      scrollPaneDims;
    const { naturalTop, height: parentHeight } = parentDims;
    const { height: nodeHeight } = nodeDims;

    if (scrollDelta > 0) {
      // Scroll down
      if (mode === Mode.STICKY_TOP) {
        if (scrollY + scrollPaneOffset + offsetTop > naturalTop) {
          const topOffset = Math.max(
            0,
            scrollPaneOffset + latestScrollY - naturalTop + offsetTop
          );

          if (
            scrollY + scrollPaneOffset + viewPortHeight <=
            naturalTop + nodeHeight + topOffset + offsetBottom
          ) {
            changeMode(Mode.RELATIVE);
          } else {
            changeMode(Mode.STICKY_BOTTOM);
          }
        }
      } else if (mode === Mode.RELATIVE) {
        if (isContainerTooLow(scrollY)) {
          changeMode(Mode.STICKY_BOTTOM);
        }
      }
    } else {
      // Scroll up
      if (mode === Mode.STICKY_BOTTOM) {
        if (
          scrollPaneOffset + scrollY + viewPortHeight <
          naturalTop + parentHeight + offsetBottom
        ) {
          const bottomOffset = Math.max(
            0,
            scrollPaneOffset +
              latestScrollY +
              viewPortHeight -
              (naturalTop + nodeHeight + offsetBottom)
          );

          if (
            scrollPaneOffset + scrollY + offsetTop >=
            naturalTop + bottomOffset
          ) {
            changeMode(Mode.RELATIVE);
          } else {
            changeMode(Mode.STICKY_TOP);
          }
        }
      } else if (mode === Mode.RELATIVE) {
        if (
          scrollPaneOffset + scrollY + offsetTop <
          naturalTop + relativeOffset
        ) {
          changeMode(Mode.STICKY_TOP);
        }
      }
    }
  };

  const handleScroll =
    scrollPane === window
      ? (): void => onScroll(window.scrollY)
      : (): void => onScroll((scrollPane as HTMLElement).scrollTop);

  scrollPane.addEventListener("scroll", handleScroll, passiveArg);
  scrollPane.addEventListener("mousewheel", handleScroll, passiveArg);
  unsubscribes.push(
    () => scrollPane.removeEventListener("scroll", handleScroll),
    () => scrollPane.removeEventListener("mousewheel", handleScroll)
  );
};

/**
 * Scaffolds a sticky element allowing its bottom to stick to the viewport
 * when its height is larger than the viewport during a scroll down situation,
 * and stick its top with the viewport when scrolling up again
 * @param offsetTop Top offset in pixels
 * @param offsetBottom Bottom offset in pixels
 * @param bottom Whether or not to keep the bottom as the sticky pivot instead of top
 */
export const useSticky = ({
  offsetTop = 0,
  offsetBottom = 0,
  bottom = false
}: UseStickyProps = {}): ((
  value:
    | ((prevState: HTMLElement | null) => HTMLElement | null)
    | HTMLElement
    | null
) => void) => {
  const [node, setNode] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!node || !stickyProp) {
      return;
    }

    const unsubscribes: UnsubscribeList = [];
    setup(node, unsubscribes, { offsetBottom, offsetTop, bottom });

    return () => {
      unsubscribes.forEach((callback) => callback());
    };
  }, [node, offsetBottom, offsetTop, bottom]);

  return setNode;
};
