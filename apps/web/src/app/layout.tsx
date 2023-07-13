// noinspection HtmlRequiredTitleElement

import "server-only";
import "normalize.css/normalize.css";
import "~/theme/main.scss";

import React from "react";

import { getUser } from "~/common/utils/getUser";
import CriticalStyles from "~/theme/Critical";

import Fonts from "./fonts";
import { PreloadResources } from "./preload-resources";
import StateProvider from "./state-provider";
// @ts-ignore
import themeSync from "./theme-sync.txt";

const RootLayout = async ({
  children
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> => {
  const userId = await getUser();
  const loggedIn = Boolean(userId);

  React.useEffect(() => {
    // Virtuoso's resize observer can throw this error,
    // which is caught by DnD and aborts dragging
    const errorHandler = (event: ErrorEvent): void => {
      if (
        [
          "ResizeObserver loop completed with undelivered notifications.",
          "ResizeObserver loop limit exceeded"
        ].includes(event.message)
      ) {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

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
        <Fonts />
        <CriticalStyles />
      </head>
      <body dir={"ltr"}>
        <StateProvider loggedIn={loggedIn}>{children}</StateProvider>
      </body>
    </html>
  );
};

export { metadata } from "./metadata";

export default RootLayout;
