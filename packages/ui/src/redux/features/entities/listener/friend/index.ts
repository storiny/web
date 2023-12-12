import {
  number_action,
  set_entity_record_value,
  set_self_friend_count
} from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_friend_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Increment and decrement friend count. The client can only remove a friend,
   * and to add a friend, the friend request needs to be accepted by the
   * recipient
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "friends") {
        const [, user_id, has_added_friend] = payload;

        if (!has_added_friend) {
          [
            set_self_friend_count("decrement"),
            number_action("friend_counts", user_id, "decrement")
          ].forEach(dispatch);
        }
      }
    }
  });

  /**
   * Send friend remove request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "friends") {
        const [, user_id, has_added_friend] = payload;
        await debounce_effect(`friends:${user_id}`, listener_api);

        if (!has_added_friend) {
          await fetch_api(`me/friends/${user_id}`, listener_api, {
            method: "DELETE"
          }).catch(() => undefined);
        }
      }
    }
  });
};
