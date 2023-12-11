import local_font from "next/font/local";

export const FONT_SOURCE_SERIF = local_font({
  src: [
    {
      path: "../../../../../../../packages/ui/src/static/fonts/source-serif/source-serif-regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../../packages/ui/src/static/fonts/source-serif/source-serif-bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  preload: false
});
