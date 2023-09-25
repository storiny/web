import {
  decrementAction,
  incrementAction,
  setCommentLikeCount,
  setLikedComment
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addLikedCommentListener = (
  startListening: AppStartListening
): void => {
  /**
   * Increment and decrement comment like count
   */
  startListening({
    actionCreator: setLikedComment,
    effect: ({ payload }, listenerApi) => {
      const commentId = payload[0];
      const hasLiked = listenerApi.getState().entities.likedComments[commentId];

      listenerApi.dispatch(
        setCommentLikeCount([
          commentId,
          hasLiked ? incrementAction : decrementAction
        ])
      );
    }
  });

  /**
   * Send the comment like request to the server
   */
  startListening({
    actionCreator: setLikedComment,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const commentId = payload[0];
      const hasLiked = listenerApi.getState().entities.likedComments[commentId];

      await fetchApi(`me/liked-comments/${commentId}`, listenerApi, {
        method: hasLiked ? "POST" : "DELETE"
      }).catch(() => undefined);
    }
  });
};
