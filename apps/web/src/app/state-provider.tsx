"use client";

import React from "react";

import AppStateProvider from "~/redux/components";
import { setupStore } from "~/redux/store";

// Standalone provider as functions from client components
// cannot be called on server components.
const StateProvider = ({ children, loggedIn }): React.ReactElement => (
  <AppStateProvider store={setupStore(undefined, false, loggedIn)}>
    {children}
  </AppStateProvider>
);

export default StateProvider;
