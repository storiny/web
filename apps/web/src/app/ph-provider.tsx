"use client";

import posthog from "posthog-js";
import { PostHogProvider as PostHogProviderPrimitive } from "posthog-js/react";
import React from "react";

if (
  typeof window !== "undefined" &&
  window.origin === process.env.NEXT_PUBLIC_WEB_URL
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://app.posthog.com",
    capture_pageview: false
  });
}

const PostHogProvider = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <PostHogProviderPrimitive client={posthog}>
    {children}
  </PostHogProviderPrimitive>
);

export default PostHogProvider;
