import {
  createListenerMiddleware,
  TypedStartListening,
} from "@reduxjs/toolkit";

import { addEntitiesListeners } from "~/redux/features";
import { addPreferencesListeners } from "~/redux/features";

import { AppDispatch, AppState } from "../store";

export type AppStartListening = TypedStartListening<AppState, AppDispatch>;

export const listenerMiddleware = createListenerMiddleware();

[addPreferencesListeners, addEntitiesListeners].forEach((cb) =>
  cb(listenerMiddleware.startListening as AppStartListening)
);
