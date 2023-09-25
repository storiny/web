import {
  decrementAction,
  incrementAction,
  setEntityRecordValue,
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
    actionCreator: setEntityRecordValue,
    effect: ({ payload }, listenerApi) => {
      if (payload[0] === "followedTags") {
        const [, tagId, hasFollowed] = payload;

        // TODO: ___
        listenerApi.dispatch(
          setSelfFollowedTagCount(
            hasFollowed ? incrementAction : decrementAction
          )
        );

        listenerApi.dispatch(
          setTagFollowerCount([
            tagId,
            hasFollowed ? incrementAction : decrementAction
          ])
        );
      }
    }
  });

  /**
   * Send the followed tag request to the server
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: async ({ payload }, listenerApi) => {
      if (payload[0] === "followedTags") {
        await debounceEffect(listenerApi);

        const [, tagId, hasFollowed] = payload;
        await fetchApi(`me/followed-tags/${tagId}`, listenerApi, {
          method: hasFollowed ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
