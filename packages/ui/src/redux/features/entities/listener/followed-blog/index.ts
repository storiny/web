import { number_action, set_entity_record_value } from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_followed_blog_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Increment and decrement blog follower count
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "followed_blogs") {
        const [, blog_id, has_followed] = payload;
        [
          number_action(
            "blog_follower_counts",
            blog_id,
            has_followed ? "increment" : "decrement"
          )
        ].forEach(dispatch);
      }
    }
  });

  /**
   * Send the followed blog request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "followed_blogs") {
        const [, blog_id, has_followed] = payload;
        await debounce_effect(`followed_blogs:${blog_id}`, listener_api);

        await fetch_api(`me/followed-blogs/${blog_id}`, listener_api, {
          method: has_followed ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
