"use client";

import React from "react";
import { Provider as ReduxProvider } from "react-redux";

import { TooltipProvider } from "~/components/Tooltip";
import { AppStore } from "~/redux/store";

import BannerWithState from "../BannerProvider";
import Initializer from "../Initializer";
import NotificationWithState from "../NotificationProvider";
import ToastWithState from "../ToastProvider";

const isTest = process.env.NODE_ENV === "test";

export interface AppStateProviderProps {
  /**
   * Children
   */
  children: React.ReactNode;
  /**
   * If `true`, skips rendering primitive providers. Enabled during tests.
   * @default false
   */
  ignorePrimitiveProviders?: boolean;
  /**
   * The root store of the application.
   */
  store: AppStore;
}

const AppStateProvider = ({
  store,
  ignorePrimitiveProviders,
  children,
}: AppStateProviderProps): React.ReactElement => (
  <ReduxProvider store={store}>
    <Initializer />
    <TooltipProvider delayDuration={isTest ? 0 : 800} skipDelayDuration={500}>
      {children}
    </TooltipProvider>
    {!ignorePrimitiveProviders && (
      <>
        <NotificationWithState />
        <ToastWithState />
        <BannerWithState />
      </>
    )}
  </ReduxProvider>
);

export default AppStateProvider;
