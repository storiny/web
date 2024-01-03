"use client";

import React from "react";
import { Provider as ReduxProvider } from "react-redux";

import { TooltipProvider } from "~/components/tooltip";
import { AppStore } from "~/redux/store";

import Initializer from "../initializer";
import ToastWithState from "../toast-provider";

const is_test = process.env.NODE_ENV === "test";

export interface AppStateProviderProps {
  /**
   * Children
   */
  children: React.ReactNode;
  /**
   * If `true`, skips initializing the state (network requests).
   * @default false
   */
  ignore_initializer?: boolean;
  /**
   * If `true`, skips rendering primitive providers. Enabled during tests.
   * @default false
   */
  ignore_primitive_providers?: boolean;
  /**
   * The root store of the application.
   */
  store: AppStore;
}

const AppStateProvider = ({
  store,
  ignore_primitive_providers,
  ignore_initializer,
  children
}: AppStateProviderProps): React.ReactElement => (
  <ReduxProvider store={store}>
    {!ignore_initializer && <Initializer />}
    <TooltipProvider delayDuration={is_test ? 0 : 800} skipDelayDuration={500}>
      {children}
    </TooltipProvider>
    {!ignore_primitive_providers && <ToastWithState />}
  </ReduxProvider>
);

export default AppStateProvider;
