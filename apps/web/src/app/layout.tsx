// noinspection HtmlRequiredTitleElement

import "server-only";
import "normalize.css/normalize.css";
import "~/theme/main.scss";

import dynamic from "next/dynamic";
import React from "react";

import { getSessionToken } from "~/common/utils/getSessionToken";
import CriticalStyles from "~/theme/critical";

import CriticalFonts from "./fonts/critical";
import ObserverErrorHandler from "./observer";
import { PreloadResources } from "./preload-resources";
import StateProvider from "./state-provider";
// @ts-ignore
import themeSync from "./theme-sync.txt";

const LazyFonts = dynamic(() => import("./fonts/lazy"));

const RootLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const sessionToken = getSessionToken();
  const logged_in = Boolean(sessionToken);

  return (
    <html
      lang="en"
      suppressHydrationWarning={process.env.NODE_ENV !== "development"}
    >
      <head>
        <PreloadResources />
        {/* Apply theme from localStorage as soon as possible */}
        <script
          dangerouslySetInnerHTML={{
            __html: themeSync
          }}
        />
        <link href="/favicon.ico" rel="icon" sizes="any" />
        <link
          href="/favicon.dark.ico"
          media="(prefers-color-scheme: dark)"
          rel="shortcut icon"
        />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
        <link color="#000000" href="/pinned.svg" rel="mask-icon" />
        <link
          href="/opensearch.xml"
          rel="search"
          title="Storiny"
          type="application/opensearchdescription+xml"
        />
        <CriticalStyles />
        <CriticalFonts />
        <LazyFonts />
      </head>
      <body dir={"ltr"}>
        <StateProvider logged_in={logged_in}>{children}</StateProvider>
      </body>
      <ObserverErrorHandler />
    </html>
  );
};

export { metadata } from "./metadata";

export default RootLayout;
