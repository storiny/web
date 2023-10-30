import { set_entity_record_value } from "~/redux/features";
import { AppStartListening } from "~/redux/listener-middleware";

import { debounce_effect, fetch_api } from "../utils";

export const add_bookmark_listener = (
  start_listening: AppStartListening
): void => {
  /**
   * Send the bookmark request to the server
   */
  start_listening({
    actionCreator: set_entity_record_value,
    effect: async ({ payload }, listener_api) => {
      if (payload[0] === "bookmarks") {
        const [, story_id, has_bookmarked] = payload;
        await debounce_effect(`bookmarks:${story_id}`, listener_api);

        await fetch_api(`me/bookmarks/${story_id}`, listener_api, {
          method: has_bookmarked ? "POST" : "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
