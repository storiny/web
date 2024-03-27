import { Metadata, Viewport } from "next";

const description =
  "Discover stories from your favourite writers on Storiny, the platform that fosters the narratives within you.";

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
  description,
  manifest: `${process.env.NEXT_PUBLIC_WEB_URL}/app.webmanifest`,
  openGraph: {
    title: "Storiny – Share your story",
    description,
    url: process.env.NEXT_PUBLIC_WEB_URL,
    siteName: "Storiny",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/brand/images/social-preview`,
        width: 1200,
        height: 630
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
    images: [
      `${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/brand/images/social-preview`
    ]
  },
  appleWebApp: {
    title: "Storiny",
    statusBarStyle: "default",
    startupImage: [
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-2048-2732.jpg`,
        media:
          "(width: 1024px) and (height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1668-2388.jpg`,
        media:
          "(width: 834px) and (height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1536-2048.jpg`,
        media:
          "(width: 768px) and (height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1668-2224.jpg`,
        media:
          "(width: 834px) and (height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1620-2160.jpg`,
        media:
          "(width: 810px) and (height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1290-2796.jpg`,
        media:
          "(width: 430px) and (height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1179-2556.jpg`,
        media:
          "(width: 393px) and (height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1284-2778.jpg`,
        media:
          "(width: 428px) and (height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1170-2532.jpg`,
        media:
          "(width: 390px) and (height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1125-2436.jpg`,
        media:
          "(width: 375px) and (height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1242-2688.jpg`,
        media:
          "(width: 414px) and (height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-828-1792.jpg`,
        media:
          "(width: 414px) and (height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-1242-2208.jpg`,
        media:
          "(width: 414px) and (height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-750-1334.jpg`,
        media:
          "(width: 375px) and (height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/splash_images/apple-splash-640-1136.jpg`,
        media:
          "(width: 320px) and (height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      }
    ]
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};
