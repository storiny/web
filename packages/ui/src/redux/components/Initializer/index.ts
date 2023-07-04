"use client";

import React from "react";

import {
  fetchUnreadNotificationsCount,
  fetchUser,
  syncToBrowser
} from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";

/*
 * Initializes the state of the app on initial mount.
 */
const Initializer = (): null => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(syncToBrowser());
    dispatch(fetchUser());
    dispatch(fetchUnreadNotificationsCount());
  }, [dispatch]);

  return null;
};

export default Initializer;
