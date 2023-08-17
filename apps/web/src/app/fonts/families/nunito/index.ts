import localFont from "next/font/local";

export const nunitoFont = localFont({
  src: [
    {
      path: "../../../../../../../packages/ui/src/static/fonts/nunito/nunito-regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../../packages/ui/src/static/fonts/nunito/nunito-bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  preload: false
});
