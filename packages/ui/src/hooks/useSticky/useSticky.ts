"use client";

import React from "react";

import { UseStickyProps } from "./useSticky.props";

/*
 * Original implementation: https://github.com/codecks-io/react-sticky-box
 */

const enum MODE {
  stickyTop,
  stickyBottom,
  relative,
  small,
}

type StickyMode = null | (typeof MODE)[keyof typeof MODE];
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
    },
  });

  window.addEventListener("testPassive", () => {}, options);
  window.removeEventListener("testPassive", () => {}, options);
} catch (e) {
  // noop
}

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

const isOffsetElement = (element: HTMLElement): boolean =>
  element.firstChild
    ? (element.firstChild as HTMLElement).offsetParent === element
    : true;

const offsetTill = (node: HTMLElement, target: HTMLElement): number => {
  let current: HTMLElement = node;
  let offset: number = 0;

  // If target is not an offsetParent itself, subtract its offsetTop and set correct target.
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
      width: window.innerWidth,
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

const setup = (
  node: HTMLElement,
  unsubscribes: UnsubscribeList,
  options: Required<UseStickyProps>
): void => {
  const { bottom, offsetBottom, offsetTop } = options;
  const scrollPane: Window | HTMLElement = getScrollParent(node);
  let isScheduled: boolean = false;

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
      return MODE.small;
    } else {
      if (isContainerTooLow(latestScrollY)) {
        return MODE.stickyBottom;
      } else {
        return MODE.relative;
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
      offsetTop: scrollPaneIsOffsetEl ? top : 0,
    }),
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
            scrollPaneDims.offsetTop,
    }),
  });

  const nodeDims = getDimensions({
    element: node,
    onChange: scheduleOnLayout,
    unsubscribes,
    measure: ({ height }) => ({ height }),
  });

  let relativeOffset: number = 0;
  let mode: MODE | null = onLayout();

  const changeMode = (newMode: StickyMode): void => {
    const prevMode = mode;
    mode = newMode;

    if (prevMode === MODE.relative) {
      relativeOffset = -1;
    }

    if (newMode === MODE.small) {
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
    if (newMode === MODE.relative) {
      node.style.position = "relative";
      relativeOffset =
        prevMode === MODE.stickyTop
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
      if (newMode === MODE.stickyBottom) {
        if (bottom) {
          node.style.bottom = `${offsetBottom}px`;
        } else {
          node.style.top = `${viewPortHeight - nodeHeight - offsetBottom}px`;
        }
      } else {
        // stickyTop
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

    if (mode === MODE.small) {
      return;
    }

    const { offsetTop: scrollPaneOffset, height: viewPortHeight } =
      scrollPaneDims;
    const { naturalTop, height: parentHeight } = parentDims;
    const { height: nodeHeight } = nodeDims;

    if (scrollDelta > 0) {
      // Scroll down
      if (mode === MODE.stickyTop) {
        if (scrollY + scrollPaneOffset + offsetTop > naturalTop) {
          const topOffset = Math.max(
            0,
            scrollPaneOffset + latestScrollY - naturalTop + offsetTop
          );

          if (
            scrollY + scrollPaneOffset + viewPortHeight <=
            naturalTop + nodeHeight + topOffset + offsetBottom
          ) {
            changeMode(MODE.relative);
          } else {
            changeMode(MODE.stickyBottom);
          }
        }
      } else if (mode === MODE.relative) {
        if (isContainerTooLow(scrollY)) {
          changeMode(MODE.stickyBottom);
        }
      }
    } else {
      // Scroll up
      if (mode === MODE.stickyBottom) {
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
            changeMode(MODE.relative);
          } else {
            changeMode(MODE.stickyTop);
          }
        }
      } else if (mode === MODE.relative) {
        if (
          scrollPaneOffset + scrollY + offsetTop <
          naturalTop + relativeOffset
        ) {
          changeMode(MODE.stickyTop);
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
  bottom = false,
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
