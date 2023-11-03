"use client";

import React from "react";

import {
  fetch_unread_notifications_count,
  fetch_user,
  sync_to_browser
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

const USER_POLL_DURATION = 3_00_000; // 5 minutes

/*
 * Initializes the state of the app on initial mount.
 */
const Initializer = (): null => {
  const dispatch = use_app_dispatch();

  React.useEffect(() => {
    dispatch(sync_to_browser());
    dispatch(fetch_user());
    dispatch(fetch_unread_notifications_count());

    // Keep polling the user with fixed interval
    const poll_user = setInterval(fetch_user, USER_POLL_DURATION);
    return () => clearInterval(poll_user);
  }, [dispatch]);

  return null;
};

export default Initializer;
