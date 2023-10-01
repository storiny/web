import {
  createListenerMiddleware as create_listener_middleware,
  TypedStartListening
} from "@reduxjs/toolkit";

import {
  add_entities_listeners,
  add_notifications_listeners,
  add_preferences_listeners,
  add_toast_listeners
} from "~/redux/features";

import { AppDispatch, AppState } from "../store";

export type AppStartListening = TypedStartListening<AppState, AppDispatch>;

export const listener_middleware = create_listener_middleware();

[
  add_preferences_listeners,
  add_entities_listeners,
  add_notifications_listeners,
  add_toast_listeners
].forEach((callback) =>
  callback(listener_middleware.startListening as AppStartListening)
);
