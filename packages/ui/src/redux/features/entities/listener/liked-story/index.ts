import { number_action, set_entity_record_value } from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_liked_story_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Increment and decrement story like count
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "liked_stories") {
        const [, story_id, has_liked] = payload;
        dispatch(
          number_action(
            "story_like_counts",
            story_id,
            has_liked ? "increment" : "decrement"
          )
        );
      }
    }
  });

  /**
   * Send the story like request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "liked_stories") {
        await debounce_effect(listener_api);

        const [, story_id, has_liked] = payload;
        await fetch_api(`me/liked-stories/${story_id}`, listener_api, {
          method: has_liked ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
