"use client";

import { dev_console } from "@storiny/shared/src/utils/dev-log";
import React from "react";

import { UseStickyProps } from "./use-sticky.props";

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
let sticky_prop: null | string = null;

if (
  typeof window !== "undefined" &&
  typeof CSS !== "undefined" &&
  CSS.supports
) {
  if (CSS.supports("position", "sticky")) {
    sticky_prop = "sticky";
  } else if (CSS.supports("position", "-webkit-sticky")) {
    sticky_prop = "-webkit-sticky";
  }
}

// Inspired by https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
let passive_arg: false | { passive: true } = false;

if (typeof window !== "undefined") {
  try {
    const options = Object.defineProperty({}, "passive", {
      get: (): void => {
        passive_arg = { passive: true };
      }
    });

    window.addEventListener("testPassive", () => undefined, options);
    window.removeEventListener("testPassive", () => undefined, options);
  } catch (e) {
    dev_console.error(e);
  }
}

/**
 * Returns a node's scroll parent
 * @param node Child node
 */
const get_scroll_parent = (node: HTMLElement): Window | HTMLElement => {
  let parent: HTMLElement | null = node;
  while ((parent = parent.parentElement)) {
    const overflow_y_value = getComputedStyle(parent, null).getPropertyValue(
      "overflow-y"
    );

    if (parent === document.body) {
      return window;
    }

    if (
      overflow_y_value === "auto" ||
      overflow_y_value === "scroll" ||
      overflow_y_value === "overlay"
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
const is_offset_element = (element: HTMLElement): boolean =>
  element.firstChild
    ? (element.firstChild as HTMLElement).offsetParent === element
    : true;

/**
 * Computes the offset length
 * @param node Node
 * @param target Target element
 */
const offset_till = (node: HTMLElement, target: HTMLElement): number => {
  let current: HTMLElement = node;
  let offset = 0;

  // If target is not an `offsetParent` itself, subtract its `offsetTop` and set the correct target
  if (!is_offset_element(target)) {
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
const get_parent_node = (node: HTMLElement): HTMLElement | Window => {
  let curr_parent = node.parentElement;

  while (curr_parent) {
    const style = getComputedStyle(curr_parent, null);

    if (style.getPropertyValue("display") !== "contents") {
      break;
    }

    curr_parent = curr_parent.parentElement;
  }

  return curr_parent || window;
};

/**
 * Computes dimensions
 * @param options Options
 */
const get_dimensions = <T extends object>(options: {
  element: HTMLElement | Window;
  measure: MeasureFn<T>;
  on_change: () => void;
  unsubscribes: UnsubscribeList;
}): T => {
  const { element, on_change, unsubscribes, measure } = options;

  if (element === window) {
    const get_rect = (): {
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

    const measured = measure(get_rect());
    const handler = (): void => {
      Object.assign(measured, measure(get_rect()));
      on_change();
    };

    window.addEventListener("resize", handler, passive_arg);
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
      on_change();
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
const get_vertical_padding = (
  node: HTMLElement
): { bottom: number; top: number } => {
  const computed_parent_style = getComputedStyle(node, null);
  const parent_padding_top = parseInt(
    computed_parent_style.getPropertyValue("padding-top"),
    10
  );
  const parent_padding_bottom = parseInt(
    computed_parent_style.getPropertyValue("padding-bottom"),
    10
  );

  return { top: parent_padding_top, bottom: parent_padding_bottom };
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
  const { bottom, offset_bottom, offset_top } = options;
  const scroll_pane: Window | HTMLElement = get_scroll_parent(node);
  let is_scheduled = false;

  const schedule_on_layout = (): void => {
    if (!is_scheduled) {
      requestAnimationFrame(() => {
        const next_mode = on_layout();

        if (next_mode !== mode) {
          change_mode(next_mode);
        }

        is_scheduled = false;
      });
    }

    is_scheduled = true;
  };

  let latest_scroll_y =
    scroll_pane === window
      ? window.scrollY
      : (scroll_pane as HTMLElement).scrollTop;

  const is_container_too_low = (scroll_y: number): boolean => {
    const { offsetTop: scroll_pane_offset, height: viewport_height } =
      scroll_pane_dims;
    const { natural_top } = parent_dims;
    const { height: node_height } = node_dims;

    return (
      scroll_y + scroll_pane_offset + viewport_height >=
      natural_top + node_height + relative_offset + offset_bottom
    );
  };

  const on_layout = (): StickyMode => {
    const { height: viewport_height } = scroll_pane_dims;
    const { height: node_height } = node_dims;

    if (node_height + offset_top + offset_bottom <= viewport_height) {
      return Mode.SMALL;
    }

    if (is_container_too_low(latest_scroll_y)) {
      return Mode.STICKY_BOTTOM;
    }

    return Mode.RELATIVE;
  };

  const scroll_pane_is_offset_element =
    scroll_pane !== window && is_offset_element(scroll_pane as HTMLElement);

  const scroll_pane_dims = get_dimensions({
    element: scroll_pane,
    on_change: schedule_on_layout,
    unsubscribes,
    measure: ({ height, top }) => ({
      height,
      offsetTop: scroll_pane_is_offset_element ? top : 0
    })
  });

  const parent_node = get_parent_node(node);
  const parent_paddings =
    parent_node === window
      ? { top: 0, bottom: 0 }
      : get_vertical_padding(parent_node as HTMLElement);

  const parent_dims = get_dimensions({
    element: parent_node,
    on_change: schedule_on_layout,
    unsubscribes,
    measure: ({ height }) => ({
      height: height - parent_paddings.top - parent_paddings.bottom,
      natural_top:
        parent_node === window
          ? 0
          : offset_till(
              parent_node as HTMLElement,
              scroll_pane as HTMLElement
            ) +
            parent_paddings.top +
            scroll_pane_dims.offsetTop
    })
  });

  const node_dims = get_dimensions({
    element: node,
    on_change: schedule_on_layout,
    unsubscribes,
    measure: ({ height }) => ({ height })
  });

  let relative_offset = 0;
  let mode: Mode | null = on_layout();

  const change_mode = (next_mode: StickyMode): void => {
    const prev_mode = mode;
    mode = next_mode;

    if (prev_mode === Mode.RELATIVE) {
      relative_offset = -1;
    }

    if (next_mode === Mode.SMALL) {
      node.style.position = sticky_prop as string;

      if (bottom) {
        node.style.bottom = `${offset_bottom}px`;
      } else {
        node.style.top = `${offset_top}px`;
      }

      return;
    }

    const { height: viewport_height, offsetTop: scroll_pane_offset } =
      scroll_pane_dims;
    const { height: parent_height, natural_top } = parent_dims;
    const { height: node_height } = node_dims;

    if (next_mode === Mode.RELATIVE) {
      node.style.position = "relative";
      relative_offset =
        prev_mode === Mode.STICKY_TOP
          ? Math.max(
              0,
              scroll_pane_offset + latest_scroll_y - natural_top + offset_top
            )
          : Math.max(
              0,
              scroll_pane_offset +
                latest_scroll_y +
                viewport_height -
                (natural_top + node_height + offset_bottom)
            );

      if (bottom) {
        const next_bottom = Math.max(
          0,
          parent_height - node_height - relative_offset
        );
        node.style.bottom = `${next_bottom}px`;
      } else {
        node.style.top = `${relative_offset}px`;
      }
    } else {
      node.style.position = sticky_prop as string;
      if (next_mode === Mode.STICKY_BOTTOM) {
        if (bottom) {
          node.style.bottom = `${offset_bottom}px`;
        } else {
          node.style.top = `${viewport_height - node_height - offset_bottom}px`;
        }
      } else {
        // STICKY_TOP
        if (bottom) {
          node.style.bottom = `${
            viewport_height - node_height - offset_bottom
          }px`;
        } else {
          node.style.top = `${offset_top}px`;
        }
      }
    }
  };

  change_mode(mode);

  const on_scroll = (scroll_y: number): void => {
    if (scroll_y === latest_scroll_y) {
      return;
    }

    const scroll_delta = scroll_y - latest_scroll_y;
    latest_scroll_y = scroll_y;

    if (mode === Mode.SMALL) {
      return;
    }

    const { offsetTop: scroll_pane_offset, height: viewport_height } =
      scroll_pane_dims;
    const { natural_top, height: parent_height } = parent_dims;
    const { height: node_height } = node_dims;

    if (scroll_delta > 0) {
      // Scroll down
      if (mode === Mode.STICKY_TOP) {
        if (scroll_y + scroll_pane_offset + offset_top > natural_top) {
          const top_offset = Math.max(
            0,
            scroll_pane_offset + latest_scroll_y - natural_top + offset_top
          );

          if (
            scroll_y + scroll_pane_offset + viewport_height <=
            natural_top + node_height + top_offset + offset_bottom
          ) {
            change_mode(Mode.RELATIVE);
          } else {
            change_mode(Mode.STICKY_BOTTOM);
          }
        }
      } else if (mode === Mode.RELATIVE) {
        if (is_container_too_low(scroll_y)) {
          change_mode(Mode.STICKY_BOTTOM);
        }
      }
    } else {
      // Scroll up
      if (mode === Mode.STICKY_BOTTOM) {
        if (
          scroll_pane_offset + scroll_y + viewport_height <
          natural_top + parent_height + offset_bottom
        ) {
          const bottom_offset = Math.max(
            0,
            scroll_pane_offset +
              latest_scroll_y +
              viewport_height -
              (natural_top + node_height + offset_bottom)
          );

          if (
            scroll_pane_offset + scroll_y + offset_top >=
            natural_top + bottom_offset
          ) {
            change_mode(Mode.RELATIVE);
          } else {
            change_mode(Mode.STICKY_TOP);
          }
        }
      } else if (mode === Mode.RELATIVE) {
        if (
          scroll_pane_offset + scroll_y + offset_top <
          natural_top + relative_offset
        ) {
          change_mode(Mode.STICKY_TOP);
        }
      }
    }
  };

  const handle_scroll =
    scroll_pane === window
      ? (): void => on_scroll(window.scrollY)
      : (): void => on_scroll((scroll_pane as HTMLElement).scrollTop);

  scroll_pane.addEventListener("scroll", handle_scroll, passive_arg);
  scroll_pane.addEventListener("mousewheel", handle_scroll, passive_arg);

  unsubscribes.push(
    () => scroll_pane.removeEventListener("scroll", handle_scroll),
    () => scroll_pane.removeEventListener("mousewheel", handle_scroll)
  );
};

/**
 * Scaffolds a sticky element allowing its bottom to stick to the viewport
 * when its height is larger than the viewport during a scroll down situation,
 * and stick its top with the viewport when scrolling up again
 * @param offset_top Top offset in pixels
 * @param offset_bottom Bottom offset in pixels
 * @param bottom Whether or not to keep the bottom as the sticky pivot instead of top
 */
export const use_sticky = ({
  offset_top = 0,
  offset_bottom = 0,
  bottom = false
}: UseStickyProps = {}): ((
  value:
    | ((prev_state: HTMLElement | null) => HTMLElement | null)
    | HTMLElement
    | null
) => void) => {
  const [node, set_node] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!node || !sticky_prop) {
      return;
    }

    const unsubscribes: UnsubscribeList = [];
    setup(node, unsubscribes, { offset_bottom, offset_top, bottom });

    return () => {
      unsubscribes.forEach((callback) => callback());
    };
  }, [node, offset_bottom, offset_top, bottom]);

  return set_node;
};
