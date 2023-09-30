import local_font from "next/font/local";

export const FONT_PLEX_MONO = local_font({
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

export const FONT_PLEX_MONO_LIGATURES = local_font({
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
