import { self_action, set_entity_record_value } from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_mute_listener = (start_listening: AppStartListening): void => {
  /**
   * Update mute count
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "mutes") {
        const [, , has_muted] = payload;
        dispatch(
          self_action("self_mute_count", has_muted ? "increment" : "decrement")
        );
      }
    }
  });

  /**
   * Send mute request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "mutes") {
        const [, user_id, has_muted] = payload;
        await debounce_effect(`mutes:${user_id}`, listener_api);

        await fetch_api(`me/muted-users/${user_id}`, listener_api, {
          method: has_muted ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
