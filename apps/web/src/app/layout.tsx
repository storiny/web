// noinspection HtmlRequiredTitleElement

import "server-only";
import "~/theme/global.scss";
import "~/theme/main.module.scss"; // Import the global css styles so that they have the lowest style priority

import dynamic from "next/dynamic";
import { headers } from "next/headers";
import React from "react";

import { get_session_token } from "~/common/utils/get-session-token";
import CriticalStyles from "~/theme/critical";

import ObserverErrorHandler from "./observer";
import PostHogProvider from "./ph-provider";
import { PreloadResources } from "./preload-resources";
import SelfXSSWarning from "./selfxss-warning";
import StateProvider from "./state-provider";

const Progress = dynamic(() => import("./progress"));
const PostHogPageView = dynamic(() => import("./page-view"), {
  ssr: false
});

const RootLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const nonce = headers().get("x-nonce") ?? undefined;
  const session_token = get_session_token();
  const logged_in = Boolean(session_token);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PreloadResources />
        <meta content={nonce ?? ""} name={"csp-nonce"} />
        <link
          href="/opensearch.xml"
          rel="search"
          title="Storiny"
          type="application/opensearchdescription+xml"
        />
        <CriticalStyles />
      </head>
      <PostHogProvider>
        <body dir={"ltr"}>
          <PostHogPageView />
          <Progress />
          <StateProvider logged_in={logged_in}>{children}</StateProvider>
        </body>
      </PostHogProvider>
      <ObserverErrorHandler />
      <SelfXSSWarning />
    </html>
  );
};

export { metadata } from "./metadata";

export default RootLayout;
