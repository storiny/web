import {
  decrementAction,
  incrementAction,
  setMute,
  setSelfMuteCount
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addMuteListener = (startListening: AppStartListening): void => {
  /**
   * Update mute count
   */
  startListening({
    actionCreator: setMute,
    effect: ({ payload }, listenerApi) => {
      const userId = payload[0];
      const isMuted = listenerApi.getState().entities.mutes[userId];
      listenerApi.dispatch(
        setSelfMuteCount(isMuted ? incrementAction : decrementAction)
      );
    }
  });

  /**
   * Send mute request to the server
   */
  startListening({
    actionCreator: setMute,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const userId = payload[0];
      const isMuted = listenerApi.getState().entities.mutes[userId];

      await fetchApi(`me/muted-users/${userId}`, listenerApi, {
        method: isMuted ? "POST" : "DELETE"
      }).catch(() => undefined);
    }
  });
};
