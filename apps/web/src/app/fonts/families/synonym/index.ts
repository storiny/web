import localFont from "next/font/local";

export const synonymFont = localFont({
  src: [
    {
      path: "../../../../../../packages/ui/src/static/fonts/synonym/synonym-regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../packages/ui/src/static/fonts/synonym/synonym-bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  preload: false
});
