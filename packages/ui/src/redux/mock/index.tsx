"use client";

import React from "react";

import AppStateProvider from "~/redux/components/RootProvider";
import { AuthStatus } from "~/redux/features/auth/slice";
import { initialState } from "~/redux/state";
import { AppState, setupStore } from "~/redux/store";

import { mockUsers } from "../../mocks";

/**
 * Logged in state
 * @param status Authentication status
 */
export const loggedInState = (
  status: AuthStatus = "complete"
): Partial<AppState> => ({
  auth: {
    loggedIn: true,
    status,
    user: mockUsers[4]
  }
});

/**
 * Renders children with state provider
 * @param children The children to render
 * @param loading Loading flag
 * @param loggedIn Logged in flag
 * @param ignorePrimitiveProviders Whether or not to wrap the children with primitve providers
 */
export const renderWithState = (
  children: React.ReactElement,
  {
    loading,
    loggedIn,
    ignorePrimitiveProviders
  }: {
    ignorePrimitiveProviders?: boolean;
    loading?: boolean;
    loggedIn?: boolean;
  } = {}
): React.ReactElement => {
  const store = setupStore(
    loggedIn || loading
      ? loggedInState(loading ? "loading" : "complete")
      : initialState,
    true
  );

  return (
    <AppStateProvider
      ignorePrimitiveProviders={ignorePrimitiveProviders}
      store={store}
    >
      {children}
    </AppStateProvider>
  );
};
