import localFont from "next/font/local";

export const merriweatherFont = localFont({
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
