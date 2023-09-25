import {
  decrementAction,
  incrementAction,
  setLikedReply,
  setReplyLikeCount
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addLikedReplyListener = (
  startListening: AppStartListening
): void => {
  /**
   * Increment and decrement reply like count
   */
  startListening({
    actionCreator: setLikedReply,
    effect: ({ payload }, listenerApi) => {
      const replyId = payload[0];
      const hasLiked = listenerApi.getState().entities.likedReplies[replyId];

      listenerApi.dispatch(
        setReplyLikeCount([
          replyId,
          hasLiked ? incrementAction : decrementAction
        ])
      );
    }
  });

  /**
   * Send the reply like request to the server
   */
  startListening({
    actionCreator: setLikedReply,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const replyId = payload[0];
      const hasLiked = listenerApi.getState().entities.likedReplies[replyId];

      await fetchApi(`me/liked-replies/${replyId}`, listenerApi, {
        method: hasLiked ? "POST" : "DELETE"
      }).catch(() => undefined);
    }
  });
};
