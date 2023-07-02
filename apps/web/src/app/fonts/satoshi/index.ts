import localFont from "next/font/local";

export const satoshiFont = localFont({
  src: "../../../../../../packages/ui/src/static/fonts/satoshi.woff2",
  variable: "--font-satoshi",
  preload: true
});
