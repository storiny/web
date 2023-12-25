"use client";

import React from "react";

import AppStateProvider from "~/redux/components/root-provider";
import { AuthStatus } from "~/redux/features/auth/slice";
import { initial_state } from "~/redux/state";
import { AppState, setup_store } from "~/redux/store";

import { MOCK_USERS } from "../../mocks";

/**
 * Logged in state
 * @param status Authentication status
 */
export const logged_in_state = (
  status: AuthStatus = "complete"
): Partial<AppState> => ({
  auth: {
    logged_in: true,
    status,
    user: MOCK_USERS[4]
  }
});

/**
 * Renders children with state provider
 * @param children The children to render
 * @param loading Loading flag
 * @param logged_in Logged in flag
 * @param ignore_primitive_providers Whether or not to wrap the children with primitve providers
 * @param ignore_initializer Whether or not to ignore the initializer
 */
export const render_with_state = (
  children: React.ReactElement,
  {
    loading,
    logged_in,
    ignore_primitive_providers,
    ignore_initializer
  }: {
    ignore_initializer?: boolean;
    ignore_primitive_providers?: boolean;
    loading?: boolean;
    logged_in?: boolean;
  } = {}
): React.ReactElement => {
  const store = setup_store(
    logged_in || loading
      ? logged_in_state(loading ? "loading" : "complete")
      : initial_state,
    true
  );

  return (
    <AppStateProvider
      ignore_initializer={ignore_initializer}
      ignore_primitive_providers={ignore_primitive_providers}
      store={store}
    >
      {children}
    </AppStateProvider>
  );
};
