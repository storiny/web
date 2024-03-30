"use client";

import { BLOG_GLOBAL_THEME_VARIABLE } from "@storiny/shared";
import { usePostHog as use_posthog } from "posthog-js/react";
import React from "react";

import {
  fetch_unread_notifications_count,
  fetch_user,
  select_user,
  sync_to_browser
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

const POLL_DURATION = 3_00_000; // 5 minutes

/*
 * Initializes the state of the app on initial mount.
 */
const Initializer = (): null => {
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user);
  const posthog = use_posthog();

  React.useEffect(() => {
    const blog_theme_value =
      typeof window !== "undefined" &&
      (String(window[BLOG_GLOBAL_THEME_VARIABLE as keyof typeof window]) as
        | "light"
        | "dark"
        | "system");

    dispatch(
      sync_to_browser({
        theme: blog_theme_value === false ? undefined : blog_theme_value
      })
    );

    const fetch_data = (): void => {
      dispatch(fetch_user());
      dispatch(fetch_unread_notifications_count());
    };

    // Keep polling the user and the undread notifications endpoint with fixed
    // interval.
    const poll_data = setInterval(fetch_data, POLL_DURATION);

    fetch_data();

    return () => clearInterval(poll_data);
  }, [dispatch]);

  React.useEffect(() => {
    if (user && posthog) {
      posthog.identify(user.id, {
        username: user.username,
        public_flags: user.public_flags
      });
    }
  }, [posthog, user]);

  return null;
};

export default Initializer;
