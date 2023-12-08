import { Metadata, Viewport } from "next";

const description =
  "Discover captivating stories on Storiny, the platform that harbors the narratives that reside within you.";

/**
 * Site-wide viewport config
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport#the-viewport-object
 */
export const viewport: Viewport = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#17191c" }
  ]
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};

/**
 * Site-wide metadata config
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 */
export const metadata: Metadata = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL!),
  title: {
    template: "%s — Storiny",
    default: "Storiny – Share your story"
  },
  description,
  manifest: "/app.webmanifest",
  openGraph: {
    title: "Storiny – Share your story",
    description,
    url: process.env.NEXT_PUBLIC_WEB_URL,
    siteName: "Storiny",
    images: [
      {
        url: "/og.png", // TODO: Change
        width: 630,
        height: 1200
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Storiny",
    description,
    site: "@storiny_intl",
    images: ["https://storiny.com/twitter.png"] // TODO: Change
  },
  appLinks: {
    web: {
      url: process.env.NEXT_PUBLIC_CDN_URL!,
      should_fallback: true
    }
  },
  appleWebApp: {
    title: "Storiny",
    statusBarStyle: "default",
    startupImage: [
      {
        url: "/splash_images/apple-splash-2048-2732.jpg",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1668-2388.jpg",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1536-2048.jpg",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1668-2224.jpg",
        media:
          "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1620-2160.jpg",
        media:
          "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1290-2796.jpg",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1179-2556.jpg",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1284-2778.jpg",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1170-2532.jpg",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1125-2436.jpg",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1242-2688.jpg",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-828-1792.jpg",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-1242-2208.jpg",
        media:
          "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-750-1334.jpg",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/splash_images/apple-splash-640-1136.jpg",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      }
    ]
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};
