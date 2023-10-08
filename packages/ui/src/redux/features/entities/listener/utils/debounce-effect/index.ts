import { ListenerEffectAPI } from "@reduxjs/toolkit";

import { set_rate_limit } from "~/redux/features";
import { AppDispatch, AppState } from "~/redux/store";

const DEBOUNCE_TIME = 800; // (ms)

/**
 * Debounces the listener API effect
 * @param key Endpoint key
 * @param listener_api Listener API
 */
export const debounce_effect = async (
  key: string,
  listener_api: ListenerEffectAPI<AppState, AppDispatch>
): Promise<void> => {
  const prev_state = listener_api.getState().entities.rate_limits[key];

  if (prev_state === true) {
    listener_api.cancelActiveListeners();
    await listener_api.delay(DEBOUNCE_TIME);
    // Remove rate limit
    listener_api.dispatch(set_rate_limit([key, false]));
  } else {
    listener_api.dispatch(set_rate_limit([key, true]));
  }
};
