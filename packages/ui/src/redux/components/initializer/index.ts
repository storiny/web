"use client";

import React from "react";

import {
  fetch_unread_notifications_count,
  fetch_user,
  sync_to_browser
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

/*
 * Initializes the state of the app on initial mount.
 */
const Initializer = (): null => {
  const dispatch = use_app_dispatch();

  React.useEffect(() => {
    dispatch(sync_to_browser());
    dispatch(fetch_user());
    dispatch(fetch_unread_notifications_count());
  }, [dispatch]);

  return null;
};

export default Initializer;
