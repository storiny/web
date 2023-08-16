import localFont from "next/font/local";

export const reciaFont = localFont({
  src: [
    {
      path: "../../../../../../packages/ui/src/static/fonts/recia/recia-regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../packages/ui/src/static/fonts/recia/recia-bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  preload: false
});
