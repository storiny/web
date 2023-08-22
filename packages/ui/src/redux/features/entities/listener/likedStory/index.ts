import {
  decrementAction,
  incrementAction,
  setLikedStory,
  setStoryLikeCount
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addLikedStoryListener = (
  startListening: AppStartListening
): void => {
  /**
   * Increment and decrement story like count
   */
  startListening({
    actionCreator: setLikedStory,
    effect: ({ payload }, listenerApi) => {
      const storyId = payload[0];
      const hasLiked = listenerApi.getState().entities.likedStories[storyId];

      listenerApi.dispatch(
        setStoryLikeCount([
          storyId,
          hasLiked ? incrementAction : decrementAction
        ])
      );
    }
  });

  /**
   * Send the story like request to the server
   */
  startListening({
    actionCreator: setLikedStory,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const storyId = payload[0];
      const hasLiked = listenerApi.getState().entities.likedStories[storyId];

      await fetchApi(`me/liked-stories/${storyId}`, listenerApi, {
        method: hasLiked ? "POST" : "DELETE"
      }).catch(() => undefined);
    }
  });
};
