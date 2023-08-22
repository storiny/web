import {
  decrementAction,
  falseAction,
  incrementAction,
  setFollowerCount,
  setFollowing,
  setSelfFollowingCount,
  setSubscription,
  trueAction
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addFollowingListener = (
  startListening: AppStartListening
): void => {
  /**
   * Subscribe to the user when following them by default, and unsubscribe from them when unfollowing. Also
   * update the following count
   */
  startListening({
    actionCreator: setFollowing,
    effect: ({ payload }, listenerApi) => {
      const userId = payload[0];
      const isFollowing = listenerApi.getState().entities.following[userId];

      if (isFollowing) {
        listenerApi.dispatch(setSelfFollowingCount(incrementAction));
        listenerApi.dispatch(setFollowerCount([userId, incrementAction]));
        listenerApi.dispatch(setSubscription([userId, trueAction]));
      } else {
        listenerApi.dispatch(setSelfFollowingCount(decrementAction));
        listenerApi.dispatch(setFollowerCount([userId, decrementAction]));
        listenerApi.dispatch(setSubscription([userId, falseAction]));
      }
    }
  });

  /**
   * Send the following request to the server
   */
  startListening({
    actionCreator: setFollowing,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const userId = payload[0];
      const isFollowing = listenerApi.getState().entities.following[userId];

      await fetchApi(`me/following/${userId}`, listenerApi, {
        method: isFollowing ? "POST" : "DELETE"
      }).catch(() => undefined);
    }
  });
};
