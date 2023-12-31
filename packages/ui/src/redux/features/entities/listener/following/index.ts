import {
  boolean_action,
  number_action,
  set_entity_record_value,
  set_self_following_count
} from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_following_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Subscribe to the user when following them by default, and unsubscribe from
   * them when unfollowing. Also update the following count
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "following") {
        const [, user_id, has_followed] = payload;

        if (has_followed) {
          [
            set_self_following_count("increment"),
            number_action("follower_counts", user_id, "increment"),
            boolean_action("subscriptions", user_id, true)
          ].forEach(dispatch);
        } else {
          [
            set_self_following_count("decrement"),
            number_action("follower_counts", user_id, "decrement"),
            boolean_action("subscriptions", user_id, false)
          ].forEach(dispatch);
        }
      }
    }
  });

  /**
   * Send the following request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "following") {
        const [, user_id, has_followed] = payload;
        await debounce_effect(`following:${user_id}`, listener_api);

        await fetch_api(`me/following/${user_id}`, listener_api, {
          method: has_followed ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
