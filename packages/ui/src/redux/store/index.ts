"use client";

import * as process from "node:process";

import {
  combineReducers as combine_reducers,
  configureStore as configure_store,
  PreloadedState
} from "@reduxjs/toolkit";
import {
  createStateSyncMiddleware as create_state_sync_middleware,
  withReduxStateSync as with_redux_state_sync
} from "redux-state-sync";

import { initial_state } from "~/redux/state";

import { api_slice } from "../features/api/slice";
import auth_slice from "../features/auth/slice";
import entities_slice from "../features/entities/slice";
import notifications_slice from "../features/notifications/slice";
import preferences_slice from "../features/preferences/slice";
import toast_slice from "../features/toast/slice";
import { listener_middleware } from "../listener-middleware";

export const root_reducer = combine_reducers({
  preferences: preferences_slice,
  entities: entities_slice,
  auth: auth_slice,
  notifications: notifications_slice,
  toast: toast_slice,
  [api_slice.reducerPath]: api_slice.reducer
});

/**
 * Builds up the root store
 * @param preloaded_state Optional preloaded state to consume
 * @param do_not_sync Skip the syncing behaviour across tabs
 * @param logged_in Populate the store with logged in data
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const setup_store = (
  preloaded_state: PreloadedState<AppState> = initial_state,
  do_not_sync?: boolean,
  logged_in?: boolean
) =>
  configure_store({
    reducer: do_not_sync
      ? root_reducer
      : with_redux_state_sync(
          root_reducer,
          (prev_state: AppState, next_state: AppState): AppState => ({
            ...next_state,
            api: prev_state.api
          })
        ),
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    preloadedState: {
      ...preloaded_state,
      auth: {
        ...preloaded_state.auth!,
        logged_in: Boolean(
          typeof logged_in !== "undefined"
            ? logged_in
            : preloaded_state.auth?.logged_in
        )
      }
    },
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    devTools: process.env.NODE_ENV === "development",
    middleware: (get_default_middleware) =>
      get_default_middleware().concat([
        api_slice.middleware,
        listener_middleware.middleware,
        ...(do_not_sync ||
        typeof window === "undefined" ||
        process.env.NODE_ENV === "test"
          ? []
          : [
              create_state_sync_middleware({
                channel: "__state_sync_channel__",
                blacklist: [
                  "preferences/sync_to_browser",
                  "entities/set_rate_limit"
                ],
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                broadcastChannelOption: {
                  type: "native" // Disable in SSR
                },
                predicate: (action) => !/(api|toast)\//.test(action.type),
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                prepareState: (state: AppState) => ({
                  ...state,
                  api: undefined
                }),
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                receiveState: (
                  prev_state: AppState,
                  next_state: AppState
                ): AppState => ({
                  ...next_state,
                  api: prev_state.api
                })
              })
            ])
      ])
  });

export const store = setup_store();

export type AppState = ReturnType<typeof root_reducer>;
export type AppStore = ReturnType<typeof setup_store>;
export type AppDispatch = AppStore["dispatch"];
