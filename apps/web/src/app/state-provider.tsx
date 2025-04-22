"use client";

import React from "react";

import AppStateProvider from "~/redux/components";
import { setup_store } from "~/redux/store";

// Standalone provider as functions from client components
// cannot be called on server components.
const StateProvider = ({ children, logged_in }): React.ReactElement => (
  <AppStateProvider store={setup_store(undefined, false, logged_in)}>
    {children}
  </AppStateProvider>
);

export default StateProvider;
