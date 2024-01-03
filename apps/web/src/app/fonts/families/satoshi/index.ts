import local_font from "next/font/local";

export const FONT_SATOSHI = local_font({
  src: [
    {
      path: "../../../../../../../packages/ui/src/static/fonts/satoshi/satoshi.woff2",
      style: "normal"
    },
    {
      path: "../../../../../../../packages/ui/src/static/fonts/satoshi/satoshi-italic.woff2",
      style: "italic"
    }
  ],
  preload: true
});
