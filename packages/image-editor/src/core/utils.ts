import oc from "open-color";
import { unstable_batchedUpdates } from "react-dom";

import { isEraserActive, isHandToolActive } from "./appState";
import { COLOR_PALETTE } from "./colors";
import {
  CURSOR_TYPE,
  DEFAULT_VERSION,
  EVENT,
  FONT_FAMILY,
  isDarwin,
  MIME_TYPES,
  THEME,
  WINDOWS_EMOJI_FALLBACK_FONT
} from "./constants";
import {
  FontFamilyValues,
  FontString,
  NonDeletedExcalidrawLayer
} from "./layer/types";
import { SHAPES } from "./shapes";
import { AppState, DataURL, LastActiveTool, Zoom } from "./types";
import { ResolutionType } from "./utility-types";

let mockDateTime: string | null = null;

export const setDateTimeForTests = (dateTime: string) => {
  mockDateTime = dateTime;
};

export const getDateTime = () => {
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

export const capitalizeString = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const isToolIcon = (
  target: Layer | EventTarget | null
): target is HTMLLayer =>
  target instanceof HTMLLayer && target.className.includes("ToolIcon");

export const isInputLike = (
  target: Layer | EventTarget | null
): target is
  | HTMLInputLayer
  | HTMLTextAreaLayer
  | HTMLSelectLayer
  | HTMLBRLayer
  | HTMLDivLayer =>
  (target instanceof HTMLLayer && target.dataset.type === "wysiwyg") ||
  target instanceof HTMLBRLayer || // newline in wysiwyg
  target instanceof HTMLInputLayer ||
  target instanceof HTMLTextAreaLayer ||
  target instanceof HTMLSelectLayer;

export const isInteractive = (target: Layer | EventTarget | null) =>
  isInputLike(target) ||
  (target instanceof Layer && !!target.closest("label, button"));

export const isWritableLayer = (
  target: Layer | EventTarget | null
): target is HTMLInputLayer | HTMLTextAreaLayer | HTMLBRLayer | HTMLDivLayer =>
  (target instanceof HTMLLayer && target.dataset.type === "wysiwyg") ||
  target instanceof HTMLBRLayer || // newline in wysiwyg
  target instanceof HTMLTextAreaLayer ||
  (target instanceof HTMLInputLayer &&
    (target.type === "text" || target.type === "number"));

export const getFontFamilyString = ({
  fontFamily
}: {
  fontFamily: FontFamilyValues;
}) => {
  for (const [fontFamilyString, id] of Object.entries(FONT_FAMILY)) {
    if (id === fontFamily) {
      return `${fontFamilyString}, ${WINDOWS_EMOJI_FALLBACK_FONT}`;
    }
  }
  return WINDOWS_EMOJI_FALLBACK_FONT;
};

/** returns fontSize+fontFamily string for assignment to DOM layers */
export const getFontString = ({
  fontSize,
  fontFamily
}: {
  fontFamily: FontFamilyValues;
  fontSize: number;
}) => `${fontSize}px ${getFontFamilyString({ fontFamily })}` as FontString;

export const debounce = <T extends any[]>(
  fn: (...args: T) => void,
  timeout: number
) => {
  let handle = 0;
  let lastArgs: T | null = null;
  const ret = (...args: T) => {
    lastArgs = args;
    clearTimeout(handle);
    handle = window.setTimeout(() => {
      lastArgs = null;
      fn(...args);
    }, timeout);
  };
  ret.flush = () => {
    clearTimeout(handle);
    if (lastArgs) {
      const _lastArgs = lastArgs;
      lastArgs = null;
      fn(..._lastArgs);
    }
  };
  ret.cancel = () => {
    lastArgs = null;
    clearTimeout(handle);
  };
  return ret;
};

// throttle callback to execute once per animation frame
export const throttleRAF = <T extends any[]>(
  fn: (...args: T) => void,
  opts?: { trailing?: boolean }
) => {
  let timerId: number | null = null;
  let lastArgs: T | null = null;
  let lastArgsTrailing: T | null = null;

  const scheduleFunc = (args: T) => {
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

  const ret = (...args: T) => {
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
  ret.flush = () => {
    if (timerId !== null) {
      cancelAnimationFrame(timerId);
      timerId = null;
    }
    if (lastArgs) {
      fn(...(lastArgsTrailing || lastArgs));
      lastArgs = lastArgsTrailing = null;
    }
  };
  ret.cancel = () => {
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
 *
 * @param {number} k - The value to be tweened.
 * @returns {number} The tweened value.
 */
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 4);

const easeOutInterpolate = (from: number, to: number, progress: number) =>
  (to - from) * easeOut(progress) + from;

/**
 * Animates values from `fromValues` to `toValues` using the requestAnimationFrame API.
 * Executes the `onStep` callback on each step with the interpolated values.
 * Returns a function that can be called to cancel the animation.
 *
 * @example
 * // Example usage:
 * const fromValues = { x: 0, y: 0 };
 * const toValues = { x: 100, y: 200 };
 * const onStep = ({x, y}) => {
 *   setState(x, y)
 * };
 * const onCancel = () => {
 *   console.log("Animation canceled");
 * };
 *
 * const cancelAnimation = easeToValuesRAF({
 *   fromValues,
 *   toValues,
 *   onStep,
 *   onCancel,
 * });
 *
 * // To cancel the animation:
 * cancelAnimation();
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
  /**
   * Interpolate a single value.
   * Return undefined to be handled by the default interpolator.
   */
  interpolateValue?: (
    fromValue: number,
    toValue: number,
    /** no easing applied  */
    progress: number,
    key: K
  ) => number | undefined;
  onCancel?: () => void;
  onEnd?: () => void;
  onStart?: () => void;
  onStep: (values: T) => void;
  toValues: T;
}) => {
  let canceled = false;
  let frameId = 0;
  let startTime: number;

  const step = (timestamp: number) => {
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
      const _key = key as keyof T;
      const result = ((toValues[_key] - fromValues[_key]) * factor +
        fromValues[_key]) as T[keyof T];
      newValues[_key] = result;
    });

    onStep(newValues);

    if (elapsed < duration) {
      const progress = elapsed / duration;

      const newValues = {} as T;

      Object.keys(fromValues).forEach((key) => {
        const _key = key as K;
        const startValue = fromValues[_key];
        const endValue = toValues[_key];

        let result;

        result = interpolateValue
          ? interpolateValue(startValue, endValue, progress, _key)
          : easeOutInterpolate(startValue, endValue, progress);

        if (result == null) {
          result = easeOutInterpolate(startValue, endValue, progress);
        }

        newValues[_key] = result as T[K];
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

// https://github.com/lodash/lodash/blob/es/chunk.js
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

export const selectNode = (node: Layer) => {
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

export const removeSelection = () => {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
};

export const distance = (x: number, y: number) => Math.abs(x - y);

export const updateActiveTool = (
  appState: Pick<AppState, "activeTool">,
  data: (
    | { type: (typeof SHAPES)[number]["value"] | "eraser" | "hand" | "frame" }
    | { customType: string; type: "custom" }
  ) & { lastActiveToolBeforeEraser?: LastActiveTool }
): AppState["activeTool"] => {
  if (data.type === "custom") {
    return {
      ...appState.activeTool,
      type: "custom",
      customType: data.customType
    };
  }

  return {
    ...appState.activeTool,
    lastActiveTool:
      data.lastActiveToolBeforeEraser === undefined
        ? appState.activeTool.lastActiveTool
        : data.lastActiveToolBeforeEraser,
    type: data.type,
    customType: null
  };
};

export const resetCursor = (canvas: HTMLCanvasLayer | null) => {
  if (canvas) {
    canvas.style.cursor = "";
  }
};

export const setCursor = (canvas: HTMLCanvasLayer | null, cursor: string) => {
  if (canvas) {
    canvas.style.cursor = cursor;
  }
};

let eraserCanvasCache: any;
let previewDataURL: string;
export const setEraserCursor = (
  canvas: HTMLCanvasLayer | null,
  theme: AppState["theme"]
) => {
  const cursorImageSizePx = 20;

  const drawCanvas = () => {
    const isDarkTheme = theme === THEME.DARK;
    eraserCanvasCache = document.createLayer("canvas");
    eraserCanvasCache.theme = theme;
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
    context.fillStyle = isDarkTheme ? oc.black : oc.white;
    context.fill();
    context.strokeStyle = isDarkTheme ? oc.white : oc.black;
    context.stroke();
    previewDataURL = eraserCanvasCache.toDataURL(MIME_TYPES.svg) as DataURL;
  };
  if (!eraserCanvasCache || eraserCanvasCache.theme !== theme) {
    drawCanvas();
  }

  setCursor(
    canvas,
    `url(${previewDataURL}) ${cursorImageSizePx / 2} ${
      cursorImageSizePx / 2
    }, auto`
  );
};

export const setCursorForShape = (
  canvas: HTMLCanvasLayer | null,
  appState: Pick<AppState, "activeTool" | "theme">
) => {
  if (!canvas) {
    return;
  }
  if (appState.activeTool.type === "selection") {
    resetCursor(canvas);
  } else if (isHandToolActive(appState)) {
    canvas.style.cursor = CURSOR_TYPE.GRAB;
  } else if (isEraserActive(appState)) {
    setEraserCursor(canvas, appState.theme);
    // do nothing if image tool is selected which suggests there's
    // a image-preview set as the cursor
    // Ignore custom type as well and let host decide
  } else if (!["image", "custom"].includes(appState.activeTool.type)) {
    canvas.style.cursor = CURSOR_TYPE.CROSSHAIR;
  }
};

export const isFullScreen = () => document.fullscreenLayer?.nodeName === "HTML";

export const allowFullScreen = () => document.documentLayer.requestFullscreen();

export const exitFullScreen = () => document.exitFullscreen();

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
) => {
  const x = (clientX - offsetLeft) / zoom.value - scrollX;
  const y = (clientY - offsetTop) / zoom.value - scrollY;

  return { x, y };
};

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
) => {
  const x = (sceneX + scrollX) * zoom.value + offsetLeft;
  const y = (sceneY + scrollY) * zoom.value + offsetTop;
  return { x, y };
};

export const getGlobalCSSVariable = (name: string) =>
  getComputedStyle(document.documentLayer).getPropertyValue(`--${name}`);

const RS_LTR_CHARS =
  "A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF" +
  "\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF";
const RS_RTL_CHARS = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
const RE_RTL_CHECK = new RegExp(`^[^${RS_LTR_CHARS}]*[${RS_RTL_CHARS}]`);
/**
 * Checks whether first directional character is RTL. Meaning whether it starts
 *  with RTL characters, or indeterminate (numbers etc.) characters followed by
 *  RTL.
 * See https://github.com/excalidraw/excalidraw/pull/1722#discussion_r436340171
 */
export const isRTL = (text: string) => RE_RTL_CHECK.test(text);

export const tupleToCoors = (
  xyTuple: readonly [number, number]
): { x: number; y: number } => {
  const [x, y] = xyTuple;
  return { x, y };
};

/** use as a rejectionHandler to mute filesystem Abort errors */
export const muteFSAbortError = (error?: Error) => {
  if (error?.name === "AbortError") {
    console.warn(error);
    return;
  }
  throw error;
};

export const findIndex = <T>(
  array: readonly T[],
  cb: (layer: T, index: number, array: readonly T[]) => boolean,
  fromIndex: number = 0
) => {
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

export const findLastIndex = <T>(
  array: readonly T[],
  cb: (layer: T, index: number, array: readonly T[]) => boolean,
  fromIndex: number = array.length - 1
) => {
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

export const isTransparent = (color: string) => {
  const isRGBTransparent = color.length === 5 && color.substr(4, 1) === "0";
  const isRRGGBBTransparent = color.length === 9 && color.substr(7, 2) === "00";
  return (
    isRGBTransparent ||
    isRRGGBBTransparent ||
    color === COLOR_PALETTE.transparent
  );
};

export type ResolvablePromise<T> = Promise<T> & {
  reject: (error: Error) => void;
  resolve: [T] extends [undefined] ? (value?: T) => void : (value: T) => void;
};
export const resolvablePromise = <T>() => {
  let resolve!: any;
  let reject!: any;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  (promise as any).resolve = resolve;
  (promise as any).reject = reject;
  return promise as ResolvablePromise<T>;
};

/**
 * @param func handler taking at most single parameter (event).
 */
export const withBatchedUpdates = <
  TFunction extends ((event: any) => void) | (() => void)
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never
) =>
  ((event) => {
    unstable_batchedUpdates(func as TFunction, event);
  }) as TFunction;

/**
 * barches React state updates and throttles the calls to a single call per
 * animation frame
 */
export const withBatchedUpdatesThrottled = <
  TFunction extends ((event: any) => void) | (() => void)
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never
) =>
  throttleRAF<Parameters<TFunction>>(((event) => {
    unstable_batchedUpdates(func, event);
  }) as TFunction);

//https://stackoverflow.com/a/9462382/8418
export const nFormatter = (num: number, digits: number): string => {
  const si = [
    { value: 1, symbol: "b" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let index;
  for (index = si.length - 1; index > 0; index--) {
    if (num >= si[index].value) {
      break;
    }
  }
  return (
    (num / si[index].value).toFixed(digits).replace(rx, "$1") + si[index].symbol
  );
};

export const getVersion = () =>
  document.querySelector<HTMLMetaLayer>('meta[name="version"]')?.content ||
  DEFAULT_VERSION;

// Adapted from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/emoji.js
export const supportsEmoji = () => {
  const canvas = document.createLayer("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return false;
  }
  const offset = 12;
  ctx.fillStyle = "#f00";
  ctx.textBaseline = "top";
  ctx.font = "32px Arial";
  // Modernizr used 🐨, but it is sort of supported on Windows 7.
  // Luckily 😀 isn't supported.
  ctx.fillText("😀", 0, 0);
  return ctx.getImageData(offset, offset, 1, 1).data[0] !== 0;
};

export const getNearestScrollableContainer = (
  layer: HTMLLayer
): HTMLLayer | Document => {
  let parent = layer.parentLayer;
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
    parent = parent.parentLayer;
  }
  return document;
};

export const focusNearestParent = (layer: HTMLInputLayer) => {
  let parent = layer.parentLayer;
  while (parent) {
    if (parent.tabIndex > -1) {
      parent.focus();
      return;
    }
    parent = parent.parentLayer;
  }
};

export const preventUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  // NOTE: modern browsers no longer allow showing a custom message here
  event.returnValue = "";
};

export const bytesToHexString = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => `0${byte.toString(16)}`.slice(-2))
    .join("");

export const getUpdatedTimestamp = () => (isTestEnv() ? 1 : Date.now());

/**
 * Transforms array of objects containing `id` attribute,
 * or array of ids (strings), into a Map, keyd by `id`.
 */
export const arrayToMap = <T extends { id: string } | string>(
  items: readonly T[]
) =>
  items.reduce((acc: Map<string, T>, layer) => {
    acc.set(typeof layer === "string" ? layer : layer.id, layer);
    return acc;
  }, new Map());

export const arrayToMapWithIndex = <T extends { id: string }>(
  layers: readonly T[]
) =>
  layers.reduce((acc, layer: T, idx) => {
    acc.set(layer.id, [layer, idx]);
    return acc;
  }, new Map<string, [layer: T, index: number]>());

export const isTestEnv = () => process.env.NODE_ENV === "test";

export const wrapEvent = <T extends Event>(name: EVENT, nativeEvent: T) =>
  new CustomEvent(name, {
    detail: {
      nativeEvent
    },
    cancelable: true
  });

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
        // if object, always update because its attrs could have changed
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

export const isPrimitive = (val: any) => {
  const type = typeof val;
  return val == null || (type !== "object" && type !== "function");
};

export const getFrame = () => {
  try {
    return window.self === window.top ? "top" : "iframe";
  } catch (error) {
    return "iframe";
  }
};

export const isRunningInIframe = () => getFrame() === "iframe";

export const isPromiseLike = (
  value: any
): value is Promise<ResolutionType<typeof value>> =>
  !!value &&
  typeof value === "object" &&
  "then" in value &&
  "catch" in value &&
  "finally" in value;

export const queryFocusableLayers = (container: HTMLLayer | null) => {
  const focusableLayers = container?.querySelectorAll<HTMLLayer>(
    "button, a, input, select, textarea, div[tabindex], label[tabindex]"
  );

  return focusableLayers
    ? Array.from(focusableLayers).filter(
        (layer) => layer.tabIndex > -1 && !(layer as HTMLInputLayer).disabled
      )
    : [];
};

export const isShallowEqual = <
  T extends Record<string, any>,
  I extends keyof T
>(
  objA: T,
  objB: T,
  comparators?: Record<I, (a: T[I], b: T[I]) => boolean>,
  debug = false
) => {
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

// taken from Radix UI
// https://github.com/radix-ui/primitives/blob/main/packages/core/primitive/src/primitive.tsx
export const composeEventHandlers =
  <E>(
    originalEventHandler?: (event: E) => void,
    ourEventHandler?: (event: E) => void,
    { checkForDefaultPrevented = true } = {}
  ) =>
  (event: E) => {
    originalEventHandler?.(event);

    if (
      !checkForDefaultPrevented ||
      !(event as unknown as Event).defaultPrevented
    ) {
      return ourEventHandler?.(event);
    }
  };

export const isOnlyExportingSingleFrame = (
  layers: readonly NonDeletedExcalidrawLayer[]
) => {
  const frames = layers.filter((layer) => layer.type === "frame");

  return (
    frames.length === 1 &&
    layers.every(
      (layer) => layer.type === "frame" || layer.frameId === frames[0].id
    )
  );
};
