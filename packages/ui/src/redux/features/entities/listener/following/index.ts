import {
  decrementAction,
  incrementAction,
  setEntityRecordValue,
  setFollowerCount,
  setSelfFollowingCount
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
    actionCreator: setEntityRecordValue,
    effect: ({ payload }, listenerApi) => {
      if (payload[0] === "following") {
        const [, userId, hasFollowed] = payload;

        // TODO: ---
        if (hasFollowed) {
          listenerApi.dispatch(setSelfFollowingCount(incrementAction));
          listenerApi.dispatch(setFollowerCount([userId, incrementAction]));
          listenerApi.dispatch(
            setEntityRecordValue(["subscriptions", userId, true])
          );
        } else {
          listenerApi.dispatch(setSelfFollowingCount(decrementAction));
          listenerApi.dispatch(setFollowerCount([userId, decrementAction]));
          listenerApi.dispatch(
            setEntityRecordValue(["subscriptions", userId, false])
          );
        }
      }
    }
  });

  /**
   * Send the following request to the server
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: async ({ payload }, listenerApi) => {
      if (payload[0] === "following") {
        await debounceEffect(listenerApi);

        const [, userId, hasFollowed] = payload;
        await fetchApi(`me/following/${userId}`, listenerApi, {
          method: hasFollowed ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
