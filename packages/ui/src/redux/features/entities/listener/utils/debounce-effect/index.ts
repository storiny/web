import { ListenerEffectAPI } from "@reduxjs/toolkit";

import { AppDispatch, AppState } from "~/redux/store";

const DEBOUNCE_TIME = 650; // (ms)

/**
 * Debounces the listener API effect
 * @param listener_api Listener API
 */
export const debounce_effect = async (
  listener_api: ListenerEffectAPI<AppState, AppDispatch>
): Promise<void> => {
  listener_api.cancelActiveListeners();
  await listener_api.delay(DEBOUNCE_TIME);
};
