"use client";

import {
  combineReducers,
  configureStore,
  PreloadedState
} from "@reduxjs/toolkit";
import {
  createStateSyncMiddleware,
  initStateWithPrevTab,
  withReduxStateSync
} from "redux-state-sync";

import { initialState } from "~/redux/state";

import { apiSlice } from "../features/api/slice";
import authSlice from "../features/auth/slice";
import entitiesSlice from "../features/entities/slice";
import notificationsSlice from "../features/notifications/slice";
import preferencesSlice from "../features/preferences/slice";
import toastSlice from "../features/toast/slice";
import { listenerMiddleware } from "../listenerMiddleware";

export const rootReducer = combineReducers({
  preferences: preferencesSlice,
  entities: entitiesSlice,
  auth: authSlice,
  notifications: notificationsSlice,
  toast: toastSlice,
  [apiSlice.reducerPath]: apiSlice.reducer
});

/**
 * Builds up the root store
 * @param preloadedState Optional preloaded state to consume
 * @param doNotSync Skip the syncing behaviour across tabs
 * @param loggedIn Populate the store with logged in data
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const setupStore = (
  preloadedState: PreloadedState<AppState> = initialState,
  doNotSync?: boolean,
  loggedIn?: boolean
) =>
  configureStore({
    reducer: doNotSync
      ? rootReducer
      : withReduxStateSync(
          rootReducer,
          (prevState: AppState, nextState: AppState): AppState => ({
            ...nextState,
            api: prevState.api
          })
        ),
    preloadedState: {
      ...preloadedState,
      auth: {
        ...preloadedState.auth!,
        loggedIn: Boolean(
          typeof loggedIn !== "undefined"
            ? loggedIn
            : preloadedState.auth?.loggedIn
        )
      }
    },
    devTools: !["production", "test"].includes(process.env.NODE_ENV || ""),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({}).concat([
        apiSlice.middleware,
        listenerMiddleware.middleware,
        ...(doNotSync
          ? []
          : [
              createStateSyncMiddleware({
                channel: "__state_sync_channel__",
                blacklist: ["preferences/syncToBrowser"],
                predicate: (action) => !/api\//.test(action.type),
                prepareState: (state: AppState) => ({
                  ...state,
                  api: undefined
                }),
                receiveState: (
                  prevState: AppState,
                  nextState: AppState
                ): AppState => ({
                  ...nextState,
                  api: prevState.api
                })
              })
            ])
      ])
  });

export const store = setupStore();

if (process.env.NODE_ENV !== "test" && typeof window !== "undefined") {
  initStateWithPrevTab(store);
}

export type AppState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
