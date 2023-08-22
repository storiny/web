import {
  decrementAction,
  setFollower,
  setFollowingCount,
  setSelfFollowerCount
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addFollowerListener = (
  startListening: AppStartListening
): void => {
  /**
   * Increment and decrement on follower mutation. Follower can only
   * be removed using the `Remove this follower` option
   */
  startListening({
    actionCreator: setFollower,
    effect: ({ payload }, listenerApi) => {
      const userId = payload[0];
      const hasRemovedFollower =
        !listenerApi.getState().entities.followers[userId];

      if (hasRemovedFollower) {
        listenerApi.dispatch(setSelfFollowerCount(decrementAction));
        listenerApi.dispatch(setFollowingCount([userId, decrementAction]));
      }
    }
  });

  /**
   * Send follower remove request to the server
   */
  startListening({
    actionCreator: setFollower,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const userId = payload[0];
      const hasRemovedFollower =
        !listenerApi.getState().entities.followers[userId];

      if (hasRemovedFollower) {
        await fetchApi(`me/followers/${userId}`, listenerApi, {
          method: "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
