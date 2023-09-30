import {
  number_action,
  set_entity_record_value,
  set_self_follower_count
} from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_follower_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Increment and decrement on follower mutation. Follower can only
   * be removed using the `Remove this follower` option
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "followers") {
        const [, user_id, has_added_follower] = payload;

        // User can only remove its followers
        if (!has_added_follower) {
          [
            set_self_follower_count("decrement"),
            number_action("following_counts", user_id, "decrement")
          ].forEach(dispatch);
        }
      }
    }
  });

  /**
   * Send follower remove request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "followers") {
        await debounce_effect(listener_api);

        const [, user_id, has_added_follower] = payload;
        // User can only remove its followers
        if (!has_added_follower) {
          await fetch_api(`me/followers/${user_id}`, listener_api, {
            method: "DELETE"
          }).catch(() => undefined);
        }
      }
    }
  });
};
