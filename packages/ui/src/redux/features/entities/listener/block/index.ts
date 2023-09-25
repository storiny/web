import {
  decrementAction,
  incrementAction,
  setEntityRecordValue,
  setSelfBlockCount
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addBlockListener = (startListening: AppStartListening): void => {
  /**
   * Unfollow the user, unsubscribe from them, remove them from the
   * follower list and friend list when they are blocked
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: ({ payload }, listenerApi) => {
      if (payload[0] === "blocks") {
        const [, userId, isBlocked] = payload;

        if (isBlocked) {
          [
            setEntityRecordValue(["following", userId, false]),
            setEntityRecordValue(["followers", userId, false]),
            setEntityRecordValue(["friends", userId, false]),
            setEntityRecordValue(["subscriptions", userId, false]),
            setEntityRecordValue(["sentRequests", userId, false])
          ].forEach(listenerApi.dispatch);

          // TODO: ___
          listenerApi.dispatch(setSelfBlockCount(incrementAction));
        } else {
          listenerApi.dispatch(setSelfBlockCount(decrementAction));
        }
      }
    }
  });

  /**
   * Send block request to the server
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: async ({ payload }, listenerApi) => {
      if (payload[0] === "blocks") {
        await debounceEffect(listenerApi);

        const [, userId, isBlocked] = payload;
        await fetchApi(`me/blocked-users/${userId}`, listenerApi, {
          method: isBlocked ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
