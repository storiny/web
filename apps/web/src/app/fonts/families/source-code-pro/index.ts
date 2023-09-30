import local_font from "next/font/local";

export const FONT_SOURCE_CODE_PRO = local_font({
  src: "../../../../../../../packages/ui/src/static/fonts/source-code-pro/source-code-pro.woff2",
  weight: "400",
  style: "normal",
  preload: false
});

export const FONT_SOURCE_CODE_PRO_LIGATURES = local_font({
  src: "../../../../../../../packages/ui/src/static/fonts/source-code-pro/source-code-pro-ligatures.woff2",
  weight: "400",
  style: "normal",
  preload: false
});
