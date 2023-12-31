import {
  IS_APPLE_WEBKIT,
  IS_IOS,
  IS_SAFARI
} from "@storiny/shared/src/browsers";

// Code format
export const IS_CODE = 1 << 4;

// Reconciliation
export const NON_BREAKING_SPACE = "\u00A0";
const ZERO_WIDTH_SPACE = "\u200b";

// For iOS/Safari we use a non-breaking space, otherwise the cursor appears to
// overlap the composed text.
export const COMPOSITION_SUFFIX: string =
  IS_SAFARI || IS_IOS || IS_APPLE_WEBKIT
    ? NON_BREAKING_SPACE
    : ZERO_WIDTH_SPACE;
