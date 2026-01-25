import "server-only";

import { Metadata } from "next";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import React from "react";

// @ts-expect-error text file import
import theme_sync from "../theme-sync.txt";

const LazyFonts = dynamic(() => import("../fonts/lazy"));

export const metadata: Metadata = {
  applicationName: "Storiny",
  title: {
    template: "%s — Storiny",
    default: "Storiny – Share your story"
  },
  icons: [
    {
      rel: "icon",
      sizes: "any",
      url: "/favicon.ico"
    },
    {
      rel: "shortcut icon",
      media: "(prefers-color-scheme: dark)",
      url: "/favicon.dark.ico"
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "/favicon.svg"
    },
    {
      rel: "apple-touch-icon",
      url: "/icons/apple-touch-icon.png"
    },
    {
      color: "#000000",
      url: "/pinned.svg",
      rel: "mask-icon"
    }
  ]
};

const NativeLayout = async ({
  children
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> => {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <React.Fragment>
      {/* Apply theme from localStorage as soon as possible */}
      <script
        dangerouslySetInnerHTML={{
          __html: theme_sync
        }}
        nonce={nonce}
      />
      <LazyFonts />
      {children}
    </React.Fragment>
  );
};

export default NativeLayout;
