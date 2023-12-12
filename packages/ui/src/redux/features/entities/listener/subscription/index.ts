import { set_entity_record_value } from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_subscription_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Send the subscription request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      // We only send the request to the server when the source of the action
      // is the user itself. This is because following and unfollowing users
      // will also update the subscriptions record value. This would redundantly
      // call this listener, as the relations are already subscribed and
      // unsubscribed on the server when the user follows or unfollows another
      // user.
      if (payload[0] === "subscriptions" && payload[3]?.source === "user") {
        const [, user_id, has_subscribed] = payload;
        await debounce_effect(`subscriptions:${user_id}`, listener_api);

        await fetch_api(`me/subscriptions/${user_id}`, listener_api, {
          method: has_subscribed ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
