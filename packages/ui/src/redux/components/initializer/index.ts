"use client";

import React from "react";

import {
  fetch_unread_notifications_count,
  fetch_user,
  sync_to_browser
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

const POLL_DURATION = 3_00_000; // 5 minutes

/*
 * Initializes the state of the app on initial mount.
 */
const Initializer = (): null => {
  const dispatch = use_app_dispatch();

  React.useEffect(() => {
    dispatch(sync_to_browser());

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

  return null;
};

export default Initializer;
