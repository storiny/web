"use client";

import {
  usePathname as use_pathname,
  useSearchParams as use_search_params
} from "next/navigation";
import { usePostHog as use_posthog } from "posthog-js/react";
import React from "react";

const PostHogPageview = (): null => {
  const pathname = use_pathname();
  const search_params = use_search_params();
  const posthog = use_posthog();

  React.useEffect(() => {
    if (pathname && posthog) {
      // Only track events on storiny.com
      if (window.origin !== "https://storiny.com") {
        return;
      }

      let url = window.origin + pathname;

      if (search_params.toString()) {
        url = url + `?${search_params.toString()}`;
      }

      posthog.capture("$pageview", {
        $current_url: url
      });
    }
  }, [pathname, search_params, posthog]);

  return null;
};

export default PostHogPageview;
