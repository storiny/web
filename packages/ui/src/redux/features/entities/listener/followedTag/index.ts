import {
  decrementAction,
  incrementAction,
  setFollowedTag,
  setSelfFollowedTagCount,
  setTagFollowerCount
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addFollowedTagListener = (
  startListening: AppStartListening
): void => {
  /**
   * Increment and decrement tag follower count
   */
  startListening({
    actionCreator: setFollowedTag,
    effect: ({ payload }, listenerApi) => {
      const tagId = payload[0];
      const hasFollowed = listenerApi.getState().entities.followedTags[tagId];

      listenerApi.dispatch(
        setSelfFollowedTagCount(hasFollowed ? incrementAction : decrementAction)
      );

      listenerApi.dispatch(
        setTagFollowerCount([
          tagId,
          hasFollowed ? incrementAction : decrementAction
        ])
      );
    }
  });

  /**
   * Send the followed tag request to the server
   */
  startListening({
    actionCreator: setFollowedTag,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const tagId = payload[0];
      const hasFollowed = listenerApi.getState().entities.followedTags[tagId];

      await fetchApi(`me/followed-tags/${tagId}`, listenerApi, {
        method: hasFollowed ? "POST" : "DELETE"
      }).catch(() => undefined);
    }
  });
};
