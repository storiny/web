import { number_action, set_entity_record_value } from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_liked_reply_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Increment and decrement reply like count
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: ({ payload }, { dispatch }) => {
      if (payload[0] === "liked_replies") {
        const [, reply_id, has_liked] = payload;
        dispatch(
          number_action(
            "reply_like_counts",
            reply_id,
            has_liked ? "increment" : "decrement"
          )
        );
      }
    }
  });

  /**
   * Send the reply like request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "liked_replies") {
        await debounce_effect(listener_api);

        const [, reply_id, has_liked] = payload;
        await fetch_api(`me/liked-replies/${reply_id}`, listener_api, {
          method: has_liked ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
