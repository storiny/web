import localFont from "next/font/local";

export const plexMonoFont = localFont({
  src: [
    {
      path: "../../../../../../../packages/ui/src/static/fonts/plex-mono/plex-mono.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../../packages/ui/src/static/fonts/plex-mono/plex-mono-italic.woff2",
      weight: "400",
      style: "italic"
    }
  ],
  preload: false
});

export const plexMonoLigaturesFont = localFont({
  src: [
    {
      path: "../../../../../../../packages/ui/src/static/fonts/plex-mono/plex-mono-ligatures.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../../../../../packages/ui/src/static/fonts/plex-mono/plex-mono-italic-ligatures.woff2",
      weight: "400",
      style: "italic"
    }
  ],
  preload: false
});
