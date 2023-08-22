import { ListenerEffectAPI } from "@reduxjs/toolkit";

import { AppDispatch, AppState } from "~/redux/store";

const DEBOUNCE_TIME = 800; // (ms)

/**
 * Debounces the listener API effect
 * @param listenerApi Listener API
 */
export const debounceEffect = async (
  listenerApi: ListenerEffectAPI<AppState, AppDispatch>
): Promise<void> => {
  listenerApi.cancelActiveListeners();
  await listenerApi.delay(DEBOUNCE_TIME);
};
