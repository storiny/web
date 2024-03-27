"use client";

import React from "react";

import AppStateProvider from "~/redux/components";
import { setup_store } from "~/redux/store";

const DISABLE_SYMC =
  typeof window !== "undefined" &&
  process.env.NODE_ENV !== "development" &&
  window.origin !== "https://storiny.com";

// Standalone provider as functions from client components
// cannot be called on server components.
const StateProvider = ({ children, logged_in }): React.ReactElement => (
  <AppStateProvider store={setup_store(undefined, DISABLE_SYMC, logged_in)}>
    {children}
  </AppStateProvider>
);

export default StateProvider;
