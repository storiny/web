import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";

import { EntitiesState, set_entity_value } from "~/redux/features";
import { AppState } from "~/redux/store";
import { clamp } from "~/utils/clamp";

/**
 * Generates an action to mutate a number value for the client
 * @param key Record key
 * @param value_or_callback Value or callback. `increment` and `decrement` string
 * values can also be provided to perform the relevant action based on the previous value.
 */
export const self_action =
  (
    key: {
      [K in keyof EntitiesState]: EntitiesState[K] extends number ? K : never;
    }[keyof EntitiesState],
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
      dispatch(set_entity_value([key, value_or_callback]));
    } else {
      const prev_value = get_state().entities[key] as number | undefined;
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

      dispatch(set_entity_value([key, next_value]));
    }
  };
