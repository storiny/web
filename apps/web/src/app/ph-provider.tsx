"use client";

import posthog from "posthog-js";
import { PostHogProvider as PostHogProviderPrimitive } from "posthog-js/react";
import React from "react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://app.posthog.com",
    capture_pageview: false,
    loaded: (ph) => {
      // Only track events on storiny.com
      if (window.origin !== "https://storiny.com") {
        ph.opt_out_capturing();
      }
    }
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
