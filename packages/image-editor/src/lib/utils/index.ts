import { devConsole } from "@storiny/shared/src/utils/devLog";
import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import { ResolutionType } from "@storiny/types";
import { unstable_batchedUpdates } from "react-dom";

import { Cursor, Event as EventEnum, ImageMime, Shape } from "../../constants";
import { isDarwin, WINDOWS_EMOJI_FALLBACK_FONT } from "../../core/constants";
import { DataURL } from "../../core/types";
import { EditorState, LastActiveTool, Zoom } from "../../types";
import { isEraserActive, isHandToolActive } from "../index";

let mockDateTime: string | null = null;

export const setDateTimeForTests = (dateTime: string): void => {
  mockDateTime = dateTime;
};

export const getDateTime = (): string => {
  if (mockDateTime) {
    return mockDateTime;
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hr = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}-${hr}${min}`;
};

export const isToolIcon = (
  target: HTMLElement | EventTarget | null
): target is HTMLElement =>
  target instanceof HTMLElement && target.className.includes("ToolIcon");

/**
 * Predicate function for determining input like elements
 * @param target Target element
 */
export const isInputLike = (
  target: Element | EventTarget | null
): target is
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLBRElement
  | HTMLDivElement =>
  (target instanceof HTMLElement && target.dataset.type === "wysiwyg") ||
  target instanceof HTMLBRElement || // newline in wysiwyg
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement;

/**
 * Predicate function for determining interactive elements
 * @param target
 */
export const isInteractive = (target: Element | EventTarget | null): boolean =>
  isInputLike(target) ||
  (target instanceof Element && !!target.closest("label, button"));

/**
 * Predicate functino for determining writable elements
 * @param target
 */
export const isWritableElement = (
  target: Element | EventTarget | null
): target is
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLBRElement
  | HTMLDivElement =>
  (target instanceof HTMLElement && target.dataset.type === "wysiwyg") ||
  target instanceof HTMLBRElement || // Newline in wysiwyg
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLInputElement &&
    (target.type === "text" || target.type === "number"));

/**
 * Returns font family string with fallback
 * @param fontFamily Font family
 */
export const getFontFamilyString = (fontFamily: string): string =>
  `${fontFamily}, ${WINDOWS_EMOJI_FALLBACK_FONT}`;

/**
 * Returns fontSize and fontFamily string for assignment to DOM elements
 * @param fontSize Font size
 * @param fontFamily Font family
 */
export const getFontString = ({
  fontSize,
  fontFamily
}: {
  fontFamily: string;
  fontSize: number;
}): string => `${fontSize}px ${getFontFamilyString(fontFamily)}`;

/**
 * Debounce function
 * @param fn
 * @param timeout
 */
export const debounce = <T extends any[]>(
  fn: (...args: T) => void,
  timeout: number
): ((...args: T) => void) & { cancel: () => void; flush: () => void } => {
  let handle = 0;
  let lastArgs: T | null = null;

  const ret = (...args: T): void => {
    lastArgs = args;
    clearTimeout(handle);
    handle = window.setTimeout(() => {
      lastArgs = null;
      fn(...args);
    }, timeout);
  };

  ret.flush = (): void => {
    clearTimeout(handle);
    if (lastArgs) {
      const _lastArgs = lastArgs;
      lastArgs = null;
      fn(..._lastArgs);
    }
  };

  ret.cancel = (): void => {
    lastArgs = null;
    clearTimeout(handle);
  };

  return ret;
};

// throttle callback to execute once per animation frame

/**
 * Throttle callback to execute once per animation frame
 * @param fn Callback
 * @param opts Options
 */
export const throttleRAF = <T extends any[]>(
  fn: (...args: T) => void,
  opts?: { trailing?: boolean }
): ((...args: T) => void) => {
  let timerId: number | null = null;
  let lastArgs: T | null = null;
  let lastArgsTrailing: T | null = null;

  const scheduleFunc = (args: T): void => {
    timerId = window.requestAnimationFrame(() => {
      timerId = null;
      fn(...args);
      lastArgs = null;

      if (lastArgsTrailing) {
        lastArgs = lastArgsTrailing;
        lastArgsTrailing = null;
        scheduleFunc(lastArgs);
      }
    });
  };

  const ret = (...args: T): void => {
    if (process.env.NODE_ENV === "test") {
      fn(...args);
      return;
    }

    lastArgs = args;

    if (timerId === null) {
      scheduleFunc(lastArgs);
    } else if (opts?.trailing) {
      lastArgsTrailing = args;
    }
  };

  ret.flush = (): void => {
    if (timerId !== null) {
      cancelAnimationFrame(timerId);
      timerId = null;
    }

    if (lastArgs) {
      fn(...(lastArgsTrailing || lastArgs));
      lastArgs = lastArgsTrailing = null;
    }
  };

  ret.cancel = (): void => {
    lastArgs = lastArgsTrailing = null;
    if (timerId !== null) {
      cancelAnimationFrame(timerId);
      timerId = null;
    }
  };

  return ret;
};

/**
 * Exponential ease-out method
 * @param k Value to be tweened.
 */
export const easeOut = (k: number): number => 1 - Math.pow(1 - k, 4);

/**
 * Ease out interpolate method
 * @param from From value
 * @param to To value
 * @param progress Progress
 */
const easeOutInterpolate = (
  from: number,
  to: number,
  progress: number
): number => (to - from) * easeOut(progress) + from;

/**
 * Animates values from `fromValues` to `toValues` using the requestAnimationFrame API.
 * Executes the `onStep` callback on each step with the interpolated values, returns a
 * function that can be called to cancel the animation
 */
export const easeToValuesRAF = <
  T extends Record<keyof T, number>,
  K extends keyof T
>({
  fromValues,
  toValues,
  onStep,
  duration = 250,
  interpolateValue,
  onStart,
  onEnd,
  onCancel
}: {
  duration?: number;
  fromValues: T;
  interpolateValue?: (
    fromValue: number,
    toValue: number,
    // No easing applied
    progress: number,
    key: K
  ) => number | undefined;
  onCancel?: () => void;
  onEnd?: () => void;
  onStart?: () => void;
  onStep: (values: T) => void;
  toValues: T;
}): (() => void) => {
  let canceled = false;
  let frameId = 0;
  let startTime: number;

  const step = (timestamp: number): void => {
    if (canceled) {
      return;
    }

    if (startTime === undefined) {
      startTime = timestamp;
      onStart?.();
    }

    const elapsed = Math.min(timestamp - startTime, duration);
    const factor = easeOut(elapsed / duration);
    const newValues = {} as T;

    Object.keys(fromValues).forEach((key) => {
      newValues[key as keyof T] = ((toValues[key as keyof T] -
        fromValues[key as keyof T]) *
        factor +
        fromValues[key as keyof T]) as T[keyof T];
    });

    onStep(newValues);

    if (elapsed < duration) {
      const progress = elapsed / duration;
      const newValues = {} as T;

      Object.keys(fromValues).forEach((untypedKey) => {
        const key = untypedKey as K;
        const startValue = fromValues[key];
        const endValue = toValues[key];

        let result;

        result = interpolateValue
          ? interpolateValue(startValue, endValue, progress, key)
          : easeOutInterpolate(startValue, endValue, progress);

        if (result == null) {
          result = easeOutInterpolate(startValue, endValue, progress);
        }

        newValues[key] = result as T[K];
      });

      onStep(newValues);
      frameId = window.requestAnimationFrame(step);
    } else {
      onStep(toValues);
      onEnd?.();
    }
  };

  frameId = window.requestAnimationFrame(step);

  return () => {
    onCancel?.();
    canceled = true;
    window.cancelAnimationFrame(frameId);
  };
};

/**
 * Splits an array into chunks of smaller arrays
 * @param array Array to split
 * @param size Chunk array size
 */
export const chunk = <T extends any>(
  array: readonly T[],
  size: number
): T[][] => {
  if (!array.length || size < 1) {
    return [];
  }

  let index = 0;
  let resIndex = 0;
  const result = Array(Math.ceil(array.length / size));

  while (index < array.length) {
    result[resIndex++] = array.slice(index, (index += size));
  }

  return result;
};

/**
 * Selects a node
 * @param node Node to select
 */
export const selectNode = (node: Element): void => {
  const selection = window.getSelection();

  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

/**
 * Removes selection
 */
export const removeSelection = (): void => {
  const selection = window.getSelection();

  if (selection) {
    selection.removeAllRanges();
  }
};

/**
 * Computes distance between two coordinates
 * @param x X value
 * @param y Y value
 */
export const distance = (x: number, y: number): number => Math.abs(x - y);

/**
 * Updates active tool
 * @param editorState Editor state
 * @param data Data
 */
export const updateActiveTool = (
  editorState: Pick<EditorState, "activeTool">,
  data: { type: Shape } & {
    lastActiveToolBeforeEraser?: LastActiveTool;
  }
): EditorState["activeTool"] => ({
  ...editorState.activeTool,
  lastActiveTool:
    data.lastActiveToolBeforeEraser === undefined
      ? editorState.activeTool.lastActiveTool
      : data.lastActiveToolBeforeEraser,
  type: data.type,
  customType: null
});

/**
 * Resets cursor
 * @param canvas Canvas element
 */
export const resetCursor = (canvas: HTMLCanvasElement | null): void => {
  if (canvas) {
    canvas.style.cursor = "";
  }
};

/**
 * Sets canvas cursor
 * @param canvas Canvas element
 * @param cursor Cursor
 */
export const setCursor = (
  canvas: HTMLCanvasElement | null,
  cursor: string
): void => {
  if (canvas) {
    canvas.style.cursor = cursor;
  }
};

let eraserCanvasCache: any;
let previewDataURL: string;

/**
 * Sets eraser cursor
 * @param canvas Canvas element
 */
export const setEraserCursor = (canvas: HTMLCanvasElement | null): void => {
  const cursorImageSizePx = 20;

  const drawCanvas = (): void => {
    eraserCanvasCache = document.createElement("canvas");
    eraserCanvasCache.height = cursorImageSizePx;
    eraserCanvasCache.width = cursorImageSizePx;

    const context = eraserCanvasCache.getContext("2d")!;

    context.lineWidth = 1;
    context.beginPath();
    context.arc(
      eraserCanvasCache.width / 2,
      eraserCanvasCache.height / 2,
      5,
      0,
      2 * Math.PI
    );
    context.fillStyle = "#fff";
    context.fill();
    context.strokeStyle = "#000";
    context.stroke();

    previewDataURL = eraserCanvasCache.toDataURL(ImageMime.SVG) as DataURL;
  };

  if (!eraserCanvasCache) {
    drawCanvas();
  }

  setCursor(
    canvas,
    `url(${previewDataURL}) ${cursorImageSizePx / 2} ${
      cursorImageSizePx / 2
    }, auto`
  );
};

/**
 * Sets a cursor for shape
 * @param canvas Canvas element
 * @param editorState Editor state
 */
export const setCursorForShape = (
  canvas: HTMLCanvasElement | null,
  editorState: Pick<EditorState, "activeTool">
): void => {
  if (!canvas) {
    return;
  }

  if (editorState.activeTool.type === Shape.SELECTION) {
    resetCursor(canvas);
  } else if (isHandToolActive(editorState)) {
    canvas.style.cursor = Cursor.GRAB;
  } else if (isEraserActive(editorState)) {
    setEraserCursor(canvas);
    // Do nothing if image tool is selected which suggests there
    // is an image-preview set as the cursor
  } else if (editorState.activeTool.type !== Shape.IMAGE) {
    canvas.style.cursor = Cursor.CROSSHAIR;
  }
};

/**
 * Parses shortcut key
 * @param shortcut Shortcut key
 */
export const getShortcutKey = (shortcut: string): string => {
  shortcut = shortcut
    .replace(/\bAlt\b/i, "Alt")
    .replace(/\bShift\b/i, "Shift")
    .replace(/\b(Enter|Return)\b/i, "Enter");

  if (isDarwin) {
    return shortcut
      .replace(/\bCtrlOrCmd\b/gi, "Cmd")
      .replace(/\bAlt\b/i, "Option");
  }

  return shortcut.replace(/\bCtrlOrCmd\b/gi, "Ctrl");
};

/**
 * Converts viewport coordinates to scene coordinates
 * @param clientX Client X
 * @param clientY Client Y
 * @param zoom Zoom value
 * @param offsetLeft Offset left
 * @param offsetTop Offset top
 * @param scrollX Scroll X
 * @param scrollY Scroll Y
 */
export const viewportCoordsToSceneCoords = (
  { clientX, clientY }: { clientX: number; clientY: number },
  {
    zoom,
    offsetLeft,
    offsetTop,
    scrollX,
    scrollY
  }: {
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
    zoom: Zoom;
  }
): { x: number; y: number } => {
  const x = (clientX - offsetLeft) / zoom.value - scrollX;
  const y = (clientY - offsetTop) / zoom.value - scrollY;

  return { x, y };
};

/**
 * Converts scene coordinates to viewport coordinates
 * @param sceneX Scene X
 * @param sceneY Scene Y
 * @param zoom Zoom value
 * @param offsetLeft Offset left
 * @param offsetTop Offset top
 * @param scrollX Scroll X
 * @param scrollY Scroll Y
 */
export const sceneCoordsToViewportCoords = (
  { sceneX, sceneY }: { sceneX: number; sceneY: number },
  {
    zoom,
    offsetLeft,
    offsetTop,
    scrollX,
    scrollY
  }: {
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
    zoom: Zoom;
  }
): { x: number; y: number } => {
  const x = (sceneX + scrollX) * zoom.value + offsetLeft;
  const y = (sceneY + scrollY) * zoom.value + offsetTop;

  return { x, y };
};

/**
 * Returns global CSS variable
 * @param name Variable name
 */
export const getGlobalCSSVariable = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(`--${name}`);

/**
 * Converts X and Y tuple to coordinates
 * @param xyTuple Tuple
 */
export const tupleToCoors = (
  xyTuple: readonly [number, number]
): { x: number; y: number } => {
  const [x, y] = xyTuple;
  return { x, y };
};

/**
 * Rejection handler to mute file-system abort errors
 * @param error Error
 */
export const muteFSAbortError = (error?: Error): void => {
  if (error?.name === "AbortError") {
    devConsole.warn(error);
    return;
  }

  throw error;
};

/**
 * Finds element index using a callback function
 * @param array Array
 * @param cb Callback function
 * @param fromIndex Start index
 */
export const findIndex = <T>(
  array: readonly T[],
  cb: (element: T, index: number, array: readonly T[]) => boolean,
  fromIndex: number = 0
): number => {
  if (fromIndex < 0) {
    fromIndex = array.length + fromIndex;
  }

  fromIndex = Math.min(array.length, Math.max(fromIndex, 0));
  let index = fromIndex - 1;

  while (++index < array.length) {
    if (cb(array[index], index, array)) {
      return index;
    }
  }

  return -1;
};

/**
 * Fins the last index using a callback function
 * @param array Array
 * @param cb Callback function
 * @param fromIndex Start index
 */
export const findLastIndex = <T>(
  array: readonly T[],
  cb: (element: T, index: number, array: readonly T[]) => boolean,
  fromIndex: number = array.length - 1
): number => {
  if (fromIndex < 0) {
    fromIndex = array.length + fromIndex;
  }

  fromIndex = Math.min(array.length - 1, Math.max(fromIndex, 0));
  let index = fromIndex + 1;

  while (--index > -1) {
    if (cb(array[index], index, array)) {
      return index;
    }
  }

  return -1;
};

/**
 * Predicate function for determining transparent color values
 * @param color Color string
 */
export const isTransparent = (color: string): boolean => {
  const isRGBTransparent = color.length === 5 && color.substr(4, 1) === "0";
  const isRRGGBBTransparent = color.length === 9 && color.substr(7, 2) === "00";
  return isRGBTransparent || isRRGGBBTransparent || color === "transparent";
};

/**
 * Batching updates
 * @param func Handler
 */
export const withBatchedUpdates = <
  TFunction extends ((event: any) => void) | (() => void)
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never
): TFunction =>
  ((event) => {
    unstable_batchedUpdates(func as TFunction, event);
  }) as TFunction;

/**
 * Batches React state updates and throttles the calls to a single call
 * per animation frame
 * @param func Handler function
 */
export const withBatchedUpdatesThrottled = <
  TFunction extends ((event?: any) => void) | (() => void)
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never
): ((...args: Parameters<TFunction>) => void) =>
  throttleRAF<Parameters<TFunction>>(((event) => {
    unstable_batchedUpdates(func, event);
  }) as TFunction);

/**
 * Predicate function for determining whether emojis are supported
 * by the client
 * @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/emoji.js
 */
export const supportsEmoji = (): boolean => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return false;
  }

  const offset = 12;
  ctx.fillStyle = "#f00";
  ctx.textBaseline = "top";
  ctx.font = "32px Arial";
  ctx.fillText("😀", 0, 0);

  return ctx.getImageData(offset, offset, 1, 1).data[0] !== 0;
};

/**
 * Returns the nearest scrollable container
 * @param element Element
 */
export const getNearestScrollableContainer = (
  element: HTMLElement
): HTMLElement | Document => {
  let parent = element.parentElement;

  while (parent) {
    if (parent === document.body) {
      return document;
    }

    const { overflowY } = window.getComputedStyle(parent);
    const hasScrollableContent = parent.scrollHeight > parent.clientHeight;

    if (
      hasScrollableContent &&
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay")
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return document;
};

/**
 * Focus nearest parent of an element
 * @param element Element
 */
export const focusNearestParent = (element: HTMLInputElement): void => {
  let parent = element.parentElement;

  while (parent) {
    if (parent.tabIndex > -1) {
      parent.focus();
      return;
    }

    parent = parent.parentElement;
  }
};

/**
 * Window unload event handler
 * @param event Unload event
 */
export const preventUnload = (event: BeforeUnloadEvent): void => {
  event.preventDefault();
  // Modern browsers no longer allow showing a custom message here
  event.returnValue = "";
};

/**
 * Convrets bytes to hex string
 * @param bytes Bytes
 */
export const bytesToHexString = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => `0${byte.toString(16)}`.slice(-2))
    .join("");

export const getUpdatedTimestamp = (): number => (isTestEnv() ? 1 : Date.now());

/**
 * Transforms an array of object containing `id` property,
 * or an array of strings, into a Map, with the IDs being the
 * keys
 * @param items Items
 */
export const arrayToMap = <T extends { id: string } | string>(
  items: readonly T[]
): Map<string, T> =>
  items.reduce((acc: Map<string, T>, element) => {
    acc.set(typeof element === "string" ? element : element.id, element);
    return acc;
  }, new Map());

/**
 * Similar to `arrayToMap`, by also encodes the element index
 * @param elements Elements
 */
export const arrayToMapWithIndex = <T extends { id: string }>(
  elements: readonly T[]
): Map<string, [element: T, index: number]> =>
  elements.reduce((acc, element: T, idx) => {
    acc.set(element.id, [element, idx]);

    return acc;
  }, new Map<string, [element: T, index: number]>());

/**
 * Wraps an event into a custom event
 * @param name Event name
 * @param nativeEvent Native event
 */
export const wrapEvent = <T extends Event>(
  name: EventEnum,
  nativeEvent: T
): CustomEvent<{ nativeEvent: T }> =>
  new CustomEvent(name, {
    detail: {
      nativeEvent
    },
    cancelable: true
  });

/**
 * Updates an object
 * @param obj Object to update
 * @param updates Updates to apply
 */
export const updateObject = <T extends Record<string, any>>(
  obj: T,
  updates: Partial<T>
): T => {
  let didChange = false;

  for (const key in updates) {
    const value = (updates as any)[key];

    if (typeof value !== "undefined") {
      if (
        (obj as any)[key] === value &&
        // If an object, always update because its attrs could have changed
        (typeof value !== "object" || value === null)
      ) {
        continue;
      }

      didChange = true;
    }
  }

  if (!didChange) {
    return obj;
  }

  return {
    ...obj,
    ...updates
  };
};

/**
 * Predicate function for determining predicate values
 * @param val Value
 */
export const isPrimitive = (val: any): boolean => {
  const type = typeof val;
  return val == null || (type !== "object" && type !== "function");
};

/**
 * Predicate function for determining promises
 * @param value Value
 */
export const isPromiseLike = (
  value: any
): value is Promise<ResolutionType<typeof value>> =>
  !!value &&
  typeof value === "object" &&
  "then" in value &&
  "catch" in value &&
  "finally" in value;

/**
 * Returns all the focusable element
 * @param container Container to query
 */
export const queryFocusableElements = (
  container: HTMLElement | null
): HTMLElement[] => {
  const focusableElements = container?.querySelectorAll<HTMLElement>(
    "button, a, input, select, textarea, div[tabindex], label[tabindex]"
  );

  return focusableElements
    ? Array.from(focusableElements).filter(
        (layer) => layer.tabIndex > -1 && !(layer as HTMLInputElement).disabled
      )
    : [];
};

/**
 * Shallow object comparison
 * @param objA Object
 * @param objB Another object
 * @param comparators Comparators
 * @param debug Debug flag
 */
export const isShallowEqual = <
  T extends Record<string, any>,
  I extends keyof T
>(
  objA: T,
  objB: T,
  comparators?: Record<I, (a: T[I], b: T[I]) => boolean>,
  debug?: boolean
): boolean => {
  const aKeys = Object.keys(objA);
  const bKeys = Object.keys(objB);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => {
    const comparator = comparators?.[key as I];
    const ret = comparator
      ? comparator(objA[key], objB[key])
      : objA[key] === objB[key];

    if (!ret && debug) {
      console.info(
        `%cisShallowEqual: ${key} not equal ->`,
        "color: #8B4000",
        objA[key],
        objB[key]
      );
    }

    return ret;
  });
};

/**
 * Composes event handlers
 * @see https://github.com/radix-ui/primitives/blob/main/packages/core/primitive/src/primitive.tsx
 * @param originalEventHandler
 * @param ourEventHandler
 * @param checkForDefaultPrevented
 */
export const composeEventHandlers =
  <E>(
    originalEventHandler?: (event: E) => void,
    ourEventHandler?: (event: E) => void,
    { checkForDefaultPrevented = true } = {}
  ) =>
  (event: E): void => {
    originalEventHandler?.(event);

    if (
      !checkForDefaultPrevented ||
      !(event as unknown as Event).defaultPrevented
    ) {
      return ourEventHandler?.(event);
    }
  };
