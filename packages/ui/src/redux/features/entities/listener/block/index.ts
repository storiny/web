import {
  boolean_action,
  self_action,
  set_entity_record_value
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_block_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Unfollow the user, unsubscribe from them, remove them from the
   * follower list and friend list when they are blocked
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "blocks") {
        const [, user_id, has_blocked] = payload;

        if (has_blocked) {
          [
            boolean_action("following", user_id, false),
            boolean_action("followers", user_id, false),
            boolean_action("friends", user_id, false),
            boolean_action("subscriptions", user_id, false),
            boolean_action("sent_requests", user_id, false),
            self_action("self_block_count", "increment")
          ].forEach(dispatch);
        } else {
          dispatch(self_action("self_block_count", "decrement"));
        }
      }
    }
  });

  /**
   * Send block request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "blocks") {
        await debounce_effect(listener_api);

        const [, user_id, has_blocked] = payload;
        await fetch_api(`me/blocked-users/${user_id}`, listener_api, {
          method: has_blocked ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
