import {
  decrementAction,
  setEntityRecordValue,
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
    actionCreator: setEntityRecordValue,
    effect: ({ payload }, listenerApi) => {
      if (payload[0] === "followers") {
        const [, userId, hasAddedFollower] = payload;

        // User can only remove its followers
        // TODO: ---
        if (!hasAddedFollower) {
          listenerApi.dispatch(setSelfFollowerCount(decrementAction));
          listenerApi.dispatch(setFollowingCount([userId, decrementAction]));
        }
      }
    }
  });

  /**
   * Send follower remove request to the server
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: async ({ payload }, listenerApi) => {
      if (payload[0] === "followers") {
        await debounceEffect(listenerApi);

        const [, userId, hasAddedFollower] = payload;

        // User can only remove its followers
        if (!hasAddedFollower) {
          await fetchApi(`me/followers/${userId}`, listenerApi, {
            method: "DELETE"
          }).catch(() => undefined);
        }
      }
    }
  });
};
