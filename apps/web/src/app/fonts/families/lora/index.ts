import localFont from "next/font/local";

export const loraFont = localFont({
  src: [
    {
      path: "../../../../../../packages/ui/src/static/fonts/lora/lora-regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../packages/ui/src/static/fonts/lora/lora-bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  preload: false
});
