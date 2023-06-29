"use client";

import React from "react";

import { fetchUser, syncToBrowser } from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";

/*
 * Initializes the state of the app on initial mount.
 */
const Initializer = (): null => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(syncToBrowser());
    dispatch(fetchUser());
  }, [dispatch]);

  return null;
};

export default Initializer;
