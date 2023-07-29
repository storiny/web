import { CSSProperties } from "react";

/**
 * Returns reusable resize cursor
 * @param angle Cursor angle
 */
const getResizeCursor = (angle?: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(${angle}deg)" fill="none" width="32" height="32"><path fill="#050505" d="M18 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12.5 8 16 3l3.5 5h-7ZM19.5 24 16 29l-3.5-5h7Z"/><path stroke="#FAFAFA" stroke-linejoin="round" d="M16.41 2.71a.5.5 0 0 0-.82 0l-3.5 5a.5.5 0 0 0 .41.79h7a.5.5 0 0 0 .41-.79l-3.5-5Zm-.82 26.58a.5.5 0 0 0 .82 0l3.5-5a.5.5 0 0 0-.41-.79h-7a.5.5 0 0 0-.41.79l3.5 5ZM16 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></svg>`;

/**
 * Returns reusable rotate cursor
 * @param angle Cursor angle
 */
const getRotateCursor = (angle?: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(${angle}deg)" fill="none" width="32" height="32"><path fill="#050505" stroke="#FAFAFA" stroke-width="1.06" d="M20.75 8v2.13h-3.72a6.9 6.9 0 0 0-6.9 6.9v3.72H6.71l.9.9 3.72 3.73.38.37.37-.37 3.72-3.72.91-.91h-3.41v-3.72a3.72 3.72 0 0 1 3.72-3.72h3.72v3.41l.9-.9 3.73-3.73.37-.37-.37-.38-3.72-3.72-.91-.9V8Z"/></svg>`;

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
  `url("data:image/svg+xml,${encodeURIComponent(
    svgString
  )}") ${offset}, ${fallback}`;

export const CURSORS = {
  default: getCursorStyle(
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="32" height="32"><path fill="#050505" stroke="#FAFAFA" stroke-linejoin="round" d="M15.18 12.86a.5.5 0 0 1-.22.92l-6.15.69-3.4 5.83a.5.5 0 0 1-.93-.14L.83 4.34a.5.5 0 0 1 .76-.53l13.59 9.05Z"/></svg>',
    "progress",
    "-32 0"
  ),
  crosshair: getCursorStyle(
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="32" height="32"><path fill="#050505" stroke="#FAFAFA" stroke-linejoin="round" d="M16.5 9a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v6.5H8a.5.5 0 0 0-.5.5v1c0 .28.22.5.5.5h6.5V24c0 .28.22.5.5.5h1a.5.5 0 0 0 .5-.5v-6.5H23a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-6.5V9Z"/></svg>',
    "crosshair"
  ),
  move: getCursorStyle(
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="32" height="32"><path fill="#050505" d="M18.63 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM13.13 8l3.5-5 3.5 5h-7ZM20.13 24l-3.5 5-3.5-5h7Z"/><path stroke="#FAFAFA" stroke-linejoin="round" d="M12.72 7.71a.5.5 0 0 0 .4.79h7a.5.5 0 0 0 .42-.79l-3.5-5a.5.5 0 0 0-.82 0l-3.5 5Zm7.82 16.58a.5.5 0 0 0-.41-.79h-7a.5.5 0 0 0-.41.79l3.5 5a.5.5 0 0 0 .82 0l3.5-5Zm-3.91-5.79a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path fill="#050505" d="M16.63 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8.63 19.5l-5-3.5 5-3.5v7ZM24.63 12.5l5 3.5-5 3.5v-7Z"/><path stroke="#FAFAFA" stroke-linejoin="round" d="M8.34 19.91a.5.5 0 0 0 .79-.41v-7a.5.5 0 0 0-.79-.41l-5 3.5a.5.5 0 0 0 0 .82l5 3.5Zm16.57-7.82a.5.5 0 0 0-.78.41v7a.5.5 0 0 0 .78.41l5-3.5a.5.5 0 0 0 0-.82l-5-3.5ZM19.13 16a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/></svg>',
    "move"
  ),
  copy: getCursorStyle(
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="32" height="32"><circle cx="14" cy="22" r="5.5" fill="#050505" stroke="#FAFAFA" stroke-linejoin="round"/><path fill="#FAFAFA" d="M14.38 19.3h-.77v2.31h-2.3v.77h2.3v2.31h.77v-2.3h2.31v-.78h-2.3v-2.3Z"/><path fill="#050505" stroke="#FAFAFA" stroke-linejoin="round" d="M15.18 12.86a.5.5 0 0 1-.22.92l-6.15.69-3.4 5.83a.5.5 0 0 1-.93-.14L.83 4.34a.5.5 0 0 1 .76-.53l13.59 9.05Z"/></svg>`,
    "copy",
    "-32 0"
  ),
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
