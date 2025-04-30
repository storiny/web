"use client";

import posthog from "posthog-js";
import { PostHogProvider as PostHogProviderPrimitive } from "posthog-js/react";
import React from "react";

import { get_cookie_consent_value } from "./cookie-banner";

const PostHogProvider = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [done, set_done] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.origin === process.env.NEXT_PUBLIC_WEB_URL &&
      process.env.NODE_ENV === "production" &&
      !done
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        ui_host: "https://app.posthog.com",
        capture_pageview: false,
        persistence:
          get_cookie_consent_value() === "accepted"
            ? "localStorage+cookie"
            : "memory"
      });

      set_done(true);
    }
  }, [done]);

  return (
    <PostHogProviderPrimitive client={posthog}>
      {children}
    </PostHogProviderPrimitive>
  );
};

export default PostHogProvider;
