import {
  createListenerMiddleware,
  TypedStartListening
} from "@reduxjs/toolkit";

import {
  addEntitiesListeners,
  addNotificationsListeners,
  addPreferencesListeners,
  addToastListeners
} from "~/redux/features";

import { AppDispatch, AppState } from "../store";

export type AppStartListening = TypedStartListening<AppState, AppDispatch>;

export const listenerMiddleware = createListenerMiddleware();

[
  addPreferencesListeners,
  addEntitiesListeners,
  addNotificationsListeners,
  addToastListeners
].forEach((cb) => cb(listenerMiddleware.startListening as AppStartListening));
