import local_font from "next/font/local";

export const FONT_MERRIWEATHER = local_font({
  src: [
    {
      path: "../../../../../../../packages/ui/src/static/fonts/merriweather/merriweather-regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../../packages/ui/src/static/fonts/merriweather/merriweather-bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  preload: false
});
