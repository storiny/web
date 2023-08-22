import {
  decrementAction,
  falseAction,
  incrementAction,
  setBlock,
  setFollower,
  setFollowing,
  setFriend,
  setSelfBlockCount,
  setSentRequest,
  setSubscription
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addBlockListener = (startListening: AppStartListening): void => {
  /**
   * Unfollow the user, unsubscribe from them, remove them from the
   * follower list and friend list when they are blocked
   */
  startListening({
    actionCreator: setBlock,
    effect: ({ payload }, listenerApi) => {
      const userId = payload[0];
      const isBlocked = listenerApi.getState().entities.blocks[userId];

      if (isBlocked) {
        listenerApi.dispatch(setFollowing([userId, falseAction]));
        listenerApi.dispatch(setFollower([userId, falseAction]));
        listenerApi.dispatch(setFriend([userId, falseAction]));
        listenerApi.dispatch(setSubscription([userId, falseAction]));
        listenerApi.dispatch(setSentRequest([userId, falseAction]));
        listenerApi.dispatch(setSelfBlockCount(incrementAction));
      } else {
        listenerApi.dispatch(setSelfBlockCount(decrementAction));
      }
    }
  });

  /**
   * Send block request to the server
   */
  startListening({
    actionCreator: setBlock,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const userId = payload[0];
      const isBlocked = listenerApi.getState().entities.blocks[userId];

      await fetchApi(`me/blocked-users/${userId}`, listenerApi, {
        method: isBlocked ? "POST" : "DELETE"
      }).catch(() => undefined);
    }
  });
};
