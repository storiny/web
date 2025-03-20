import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";

import { EntitiesState, set_entity_record_value } from "~/redux/features";
import { AppState } from "~/redux/store";
import { clamp } from "~/utils/clamp";

/**
 * Generates an action to mutate a number value in a `Record<string, number>`
 * @param key Record key
 * @param id Entity ID
 * @param value_or_callback Value or callback. `increment` and `decrement` string
 * values can also be provided to perform the relevant action based on the previous value.
 */
export const number_action =
  (
    key: {
      [K in keyof EntitiesState]: EntitiesState[K] extends Record<
        string,
        number
      >
        ? K
        : never;
    }[keyof EntitiesState],
    id: string,
    value_or_callback:
      | "increment"
      | "decrement"
      | number
      | ((prev_value: number) => number)
  ) =>
  (
    dispatch: ThunkDispatch<AppState, unknown, AnyAction>,
    get_state: () => AppState
  ): void => {
    if (typeof value_or_callback === "number") {
      dispatch(set_entity_record_value([key, id, value_or_callback]));
    } else {
      const prev_value = get_state().entities[key][id] as number | undefined;
      const curr_value = typeof prev_value === "undefined" ? 0 : prev_value;
      const next_value = clamp(
        0,
        value_or_callback === "increment"
          ? curr_value + 1
          : value_or_callback === "decrement"
            ? curr_value - 1
            : value_or_callback(curr_value),
        Infinity
      );

      dispatch(set_entity_record_value([key, id, next_value]));
    }
  };
