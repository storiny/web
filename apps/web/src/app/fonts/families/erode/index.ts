import local_font from "next/font/local";

export const FONT_ERODE = local_font({
  src: [
    {
      path: "../../../../../../../packages/ui/src/static/fonts/erode/erode-regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../../packages/ui/src/static/fonts/erode/erode-bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  preload: false
});
