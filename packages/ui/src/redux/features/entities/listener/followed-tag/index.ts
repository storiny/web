import {
  number_action,
  self_action,
  set_entity_record_value
} from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_followed_tag_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Increment and decrement tag follower count
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "followed_tags") {
        const [, tag_id, has_followed] = payload;
        [
          number_action(
            "tag_follower_counts",
            tag_id,
            has_followed ? "increment" : "decrement"
          ),
          self_action(
            "self_followed_tag_count",
            has_followed ? "increment" : "decrement"
          )
        ].forEach(dispatch);
      }
    }
  });

  /**
   * Send the followed tag request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "followed_tags") {
        await debounce_effect(listener_api);

        const [, tag_id, has_followed] = payload;
        await fetch_api(`me/followed-tags/${tag_id}`, listener_api, {
          method: has_followed ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
