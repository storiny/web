import { CSSProperties } from "react";

/**
 * Wraps SVG data into SVG string
 * @param data SVG elements
 * @param style Additional styles applied to the SVG
 */
const wrapSvg = (data: string, style?: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="32" height="32"${
    style ? ` style="${style}"` : ""
  }>${data}</svg>`;

/**
 * Returns the CSS cursor style
 * @param svgString Cursor SVG markup
 * @param fallback Native cursor fallback
 * @param offset Cursor offset
 */
const getCursorStyle = (
  svgString: string,
  fallback: CSSProperties["cursor"] = "default",
  offset = "16 16"
): string =>
  `url("data:image/svg+xml;base64,${btoa(svgString)}") ${offset}, ${fallback}`;

/**
 * Returns reusable resize cursor
 * @param angle Cursor angle
 */
const getResizeCursor = (angle?: number): string =>
  wrapSvg(
    '<path fill="#050505" d="M18 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12.5 8 16 3l3.5 5h-7ZM19.5 24 16 29l-3.5-5h7Z"/><path stroke="#fafafa" stroke-linejoin="round" stroke-width="1.75" d="M16.72 2.5a.87.87 0 0 0-1.44 0l-3.5 5a.87.87 0 0 0 .72 1.38h7a.87.87 0 0 0 .72-1.38l-3.5-5Zm-1.44 27a.87.87 0 0 0 1.44 0l3.5-5a.88.88 0 0 0-.72-1.38h-7a.87.87 0 0 0-.72 1.38l3.5 5ZM16 18.87a2.88 2.88 0 1 0 0-5.75 2.88 2.88 0 0 0 0 5.76Z"/>',
    `transform:rotate(${angle}deg)`
  );

/**
 * Returns reusable rotate cursor
 * @param angle Cursor angle
 */
const getRotateCursor = (angle?: number): string =>
  wrapSvg(
    '<path fill="#050505" stroke="#fafafa" stroke-width="1.25" d="M20.66 8v2.03h-3.63a7 7 0 0 0-7 7v3.63H6.5l1.06 1.06 3.72 3.72.44.44.44-.44 3.72-3.72 1.07-1.06H13.4v-3.63a3.62 3.62 0 0 1 3.62-3.62h3.63v3.53l1.06-1.06 3.72-3.72.44-.44-.44-.44-3.72-3.72-1.06-1.07V8Z"/>',
    `transform:rotate(${angle}deg)`
  );

/**
 * Returns pen cursor with the specified fill
 * @param fill Pen fill
 */
const getPenCursor = (fill: string = "#050505"): string =>
  wrapSvg(
    `<path fill="${fill}" stroke="#fafafa" stroke-linejoin="round" stroke-width="1.75" d="M18.26 9.5a.87.87 0 0 0-.24.47.87.87 0 0 0-.47.24l-8.84 8.84a.88.88 0 0 0-.23.4l-.7 2.83a.87.87 0 0 0 1.06 1.06l2.83-.7c.15-.04.3-.12.4-.23l8.84-8.84a.88.88 0 0 0 .24-.47.88.88 0 0 0 .47-.24l1.41-1.41c.74-.74.74-1.92 0-2.65l-.7-.71a1.87 1.87 0 0 0-2.66 0L18.26 9.5Z"/>`
  );

export const CURSORS = {
  default: getCursorStyle(
    wrapSvg(
      '<path fill="#050505" stroke="#fafafa" stroke-linejoin="round" stroke-width="1.25" d="M15.25 12.76a.63.63 0 0 1-.28 1.14l-6.09.69-3.37 5.78a.62.62 0 0 1-1.15-.18L.71 4.36a.62.62 0 0 1 .95-.66l13.59 9.06Z"/>'
    ),
    "progress",
    "-32 0"
  ),
  crosshair: getCursorStyle(
    wrapSvg(
      '<path fill="#050505" stroke="#fafafa" stroke-linejoin="round" stroke-width="1.75" d="M15 8.13c-.48 0-.88.39-.88.87v6.13H8c-.48 0-.88.39-.88.87v1c0 .48.4.88.88.88h6.13V24c0 .48.39.88.87.88h1c.48 0 .88-.4.88-.88v-6.13H23c.48 0 .88-.39.88-.87v-1a.87.87 0 0 0-.88-.88h-6.13V9a.88.88 0 0 0-.87-.88h-1Z"/>'
    ),
    "crosshair"
  ),
  move: getCursorStyle(
    wrapSvg(
      '<path fill="#050505" stroke="#fafafa" stroke-linejoin="round" stroke-width="1.75" d="M17.34 2.5a.87.87 0 0 0-1.43 0l-3.5 5a.87.87 0 0 0 .72 1.38h7a.88.88 0 0 0 .71-1.38l-3.5-5Zm-1.43 27a.88.88 0 0 0 1.43 0l3.5-5a.88.88 0 0 0-.71-1.38h-7a.87.87 0 0 0-.72 1.38l3.5 5Zm.72-10.63a2.88 2.88 0 1 0 0-5.75 2.88 2.88 0 0 0 0 5.76Z"/><path fill="#050505" stroke="#fafafa" stroke-linejoin="round" stroke-width="1.75" d="M3.13 15.28a.87.87 0 0 0 0 1.44l5 3.5a.87.87 0 0 0 1.37-.72v-7a.87.87 0 0 0-1.37-.72l-5 3.5Zm27 1.44a.87.87 0 0 0 0-1.44l-5-3.5a.88.88 0 0 0-1.38.72v7a.87.87 0 0 0 1.38.72l5-3.5ZM19.5 16a2.88 2.88 0 1 0-5.75 0 2.88 2.88 0 0 0 5.75 0Z"/>'
    ),
    "move"
  ),
  copy: getCursorStyle(
    wrapSvg(
      '<path fill="#050505" d="M19 22a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"/><path fill="#fafafa" d="M14.38 19.3h-.77v2.31h-2.3v.77h2.3v2.31h.77v-2.3h2.31v-.78h-2.3v-2.3Z"/><path fill="#050505" d="M14.9 13.28 1.32 4.22l3.65 15.83L8.5 14l6.4-.72Z"/><path stroke="#fafafa" stroke-linejoin="round" stroke-width="1.25" d="M14.97 13.9a.62.62 0 0 0 .28-1.14L1.66 3.7a.62.62 0 0 0-.95.66L4.36 20.2a.62.62 0 0 0 1.15.18l3.37-5.78 6.1-.7ZM14 27.62a5.63 5.63 0 1 0 0-11.25 5.63 5.63 0 0 0 0 11.25Z"/>'
    ),
    "copy",
    "-32 0"
  ),
  grab: getCursorStyle(
    wrapSvg(
      '<path fill="#050505" stroke="#fafafa" stroke-linejoin="round" stroke-width="1.75" d="M18.7 6.7a2.19 2.19 0 0 0-.83-1.17c-.38-.27-.84-.4-1.37-.4-.53 0-1 .13-1.37.4-.38.26-.6.6-.75.94-.07.17-.12.35-.16.52a2.1 2.1 0 0 0-.68-.56c-.41-.21-.9-.28-1.41-.2-.53.06-.97.26-1.3.58-.34.31-.52.69-.61 1.04a3.87 3.87 0 0 0-.05 1.53v.02l.95 6.66v.59a7.3 7.3 0 0 0-1.21-.94A3.76 3.76 0 0 0 8 15.12c-1.25 0-2.05.5-2.48 1.14a2.4 2.4 0 0 0-.4 1.22v.01l.88.01h-.88c0 .41.3.77.7.86h.03l.2.08c.19.08.46.23.76.48a6 6 0 0 1 1.84 3.3 5.72 5.72 0 0 0 3.24 4.08c1.3.58 2.58.58 3.1.57H19V26v.88h.03a2.59 2.59 0 0 0 .2-.02 6.01 6.01 0 0 0 2.2-.57 5.07 5.07 0 0 0 2.94-4.22l.5-5.9 1.29-4.31v-.03c.08-.25.26-.87.18-1.53a2.18 2.18 0 0 0-.46-1.1c-.3-.37-.7-.62-1.2-.77a2.34 2.34 0 0 0-1.74.14c.02-.31.04-.77-.09-1.22-.1-.35-.27-.72-.6-1.04a2.34 2.34 0 0 0-1.3-.58c-.53-.08-1 0-1.42.2-.38.2-.64.48-.83.76Z"/>'
    ),
    "grab"
  ),
  grabbing: getCursorStyle(
    wrapSvg(
      '<path fill="#050505" stroke="#fafafa" stroke-linejoin="round" stroke-width="1.75" d="M15.13 10.03c-.36.25-.6.59-.73.91a2.34 2.34 0 0 0-1.46-.29 2.18 2.18 0 0 0-1.96 1.56 3.87 3.87 0 0 0-.1 1.55l.21 1.97a.87.87 0 0 0-.14.09l.17.2-.17-.2-.03.03a8.1 8.1 0 0 0-.4.34c-.24.22-.58.54-.92.9-.33.38-.69.82-.96 1.29a3.28 3.28 0 0 0-.5 1.74c.28 2 1.41 3.68 2.71 4.84 1.28 1.14 2.85 1.91 4.15 1.91h4V26v.88h.03a2.59 2.59 0 0 0 .2-.02 6.01 6.01 0 0 0 2.2-.57 5.07 5.07 0 0 0 2.94-4.22l.5-5.93.26-1.09v-.02l.01-.03c.05-.24.19-.88.06-1.53a2.18 2.18 0 0 0-.53-1.07 2.34 2.34 0 0 0-1.26-.68 2.34 2.34 0 0 0-1.52.15 2.1 2.1 0 0 0-.5-.67c-.36-.3-.8-.49-1.33-.55a2.34 2.34 0 0 0-1.46.29 2.18 2.18 0 0 0-.73-.91c-.38-.27-.84-.4-1.37-.4-.53 0-1 .13-1.37.4Z"/>'
    ),
    "grabbing"
  ),
  pen: (fill?: string) =>
    getCursorStyle(getPenCursor(fill), "crosshair", "8 24"),
  rotate: (angle?: number) =>
    getCursorStyle(getRotateCursor(angle), "crosshair"),
  "n-resize": getCursorStyle(getResizeCursor(), "n-resize"),
  "s-resize": getCursorStyle(getResizeCursor(), "s-resize"),
  "nw-resize": getCursorStyle(getResizeCursor(-45), "ne-resize"),
  "se-resize": getCursorStyle(getResizeCursor(-45), "sw-resize"),
  "ne-resize": getCursorStyle(getResizeCursor(45), "ne-resize"),
  "sw-resize": getCursorStyle(getResizeCursor(45), "sw-resize"),
  "w-resize": getCursorStyle(getResizeCursor(90), "w-resize"),
  "e-resize": getCursorStyle(getResizeCursor(90), "e-resize")
} as const;
