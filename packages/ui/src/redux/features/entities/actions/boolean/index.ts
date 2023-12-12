import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";

import { EntitiesState, set_entity_record_value } from "~/redux/features";
import { AppState } from "~/redux/store";

/**
 * Generates an action to mutate a boolean value in a `Record<string, boolean>`
 * @param key Record key
 * @param id Entity ID
 * @param value_or_callback Value or callback. `undefined` can be provided to toggle
 * @param tags The optional additional metadata about the action.
 * the boolean value based on the previous state.
 */
export const boolean_action =
  (
    key: {
      [K in keyof EntitiesState]: EntitiesState[K] extends Record<
        string,
        boolean
      >
        ? K
        : never;
    }[keyof EntitiesState],
    id: string,
    value_or_callback?: boolean | ((prev_value: boolean) => boolean),
    tags?: Record<string, string | number | boolean>
  ) =>
  (
    dispatch: ThunkDispatch<AppState, unknown, AnyAction>,
    get_state: () => AppState
  ): void => {
    if (typeof value_or_callback === "boolean") {
      dispatch(set_entity_record_value([key, id, value_or_callback, tags]));
    } else {
      const prev_value = get_state().entities[key][id] as boolean | undefined;

      if (typeof value_or_callback === "undefined") {
        dispatch(set_entity_record_value([key, id, !prev_value, tags])); // Toggle value
      } else {
        // Set to `true` when absent from the map
        const curr_value =
          typeof prev_value === "undefined" ? true : prev_value;
        dispatch(
          set_entity_record_value([
            key,
            id,
            value_or_callback(curr_value),
            tags
          ])
        );
      }
    }
  };
