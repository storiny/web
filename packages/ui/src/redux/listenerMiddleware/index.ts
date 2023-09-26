import {
  createListenerMiddleware,
  TypedStartListening
} from "@reduxjs/toolkit";

import {
  add_entities_listeners,
  add_notifications_listeners,
  addPreferencesListeners,
  addToastListeners
} from "~/redux/features";

import { AppDispatch, AppState } from "../store";

export type AppStartListening = TypedStartListening<AppState, AppDispatch>;

export const listener_middleware = createListenerMiddleware();

[
  addPreferencesListeners,
  add_entities_listeners,
  add_notifications_listeners,
  addToastListeners
].forEach((callback) =>
  callback(listener_middleware.startListening as AppStartListening)
);
