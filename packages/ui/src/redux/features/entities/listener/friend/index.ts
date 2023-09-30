import {
  number_action,
  render_toast,
  set_entity_record_value,
  set_self_friend_count
} from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_friend_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Send friend request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "sent_requests") {
        await debounce_effect(listener_api);
        const [, user_id, has_sent_friend_request] = payload;

        if (has_sent_friend_request) {
          await fetch_api(`me/friends/${user_id}`, listener_api, {
            method: "POST"
          })
            .then((res) => {
              if (res) {
                if (res.ok) {
                  listener_api.dispatch(
                    render_toast({
                      message: "Friend request sent",
                      severity: "success"
                    })
                  );
                } else {
                  res
                    .json()
                    .then((json) => {
                      listener_api.dispatch(
                        render_toast({
                          message:
                            json?.error || "Could not send your friend request",
                          severity: "error"
                        })
                      );
                    })
                    .catch(() => undefined);
                }
              }
            })
            .catch(() => undefined);
        }
      }
    }
  });

  /**
   * Increment and decrement friend count. The client can only remove a friend,
   * and to add a friend, the friend request needs to be accepted by the recipient
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
        await debounce_effect(listener_api);
        const [, user_id, has_added_friend] = payload;

        if (!has_added_friend) {
          await fetch_api(`me/friends/${user_id}`, listener_api, {
            method: "DELETE"
          }).catch(() => undefined);
        }
      }
    }
  });
};
