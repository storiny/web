import React from "react";

import { SV_MAX } from "../../color/constants";
import { Key } from "../../keys";
import { use_slider } from "../use-slider";
import { UseColorBoardProps } from "./use-color-board.props";

/**
 * Default aria strings
 */
const ARIA_STRINGS = {
  aria_label: "Saturation and brightness",
  aria_value_format: "Saturation {0} brightness {1}",
  aria_description:
    "Use left and right arrow keys to set saturation. Use up and down arrow keys to set brightness."
};

/**
 * Hook for color board
 * @param props
 */
export const use_color_board = (
  props: UseColorBoardProps
): {
  container_props: React.HTMLAttributes<HTMLElement>;
  description_props: React.HTMLAttributes<HTMLElement>;
} => {
  const {
    state,
    ref,
    aria_description = ARIA_STRINGS.aria_description,
    aria_label = ARIA_STRINGS.aria_label,
    aria_value_format = ARIA_STRINGS.aria_value_format
  } = props;
  const board_id = React.useId();
  const description_id = React.useId();
  const is_adjusting_saturation = React.useRef<boolean>(false);
  const color = state.color;
  const value_text = aria_value_format
    .replace("{0}", String(color.s))
    .replace("{1}", String(color.v));

  const { slider_props } = use_slider({
    ref,
    max_value: SV_MAX,
    direction: "both",
    aria_label,
    aria_value_text: value_text,
    aria_value_now: is_adjusting_saturation.current ? color.s : color.v,
    on_change: ({ x: s, y: v }) => {
      v = SV_MAX - v;
      state.set_sv(s, v);
    }
  });

  const on_key_down = (event: React.KeyboardEvent): void => {
    // Allow users to tab out. Don't prevent default if Tab is pressed
    if (event.key !== Key.Tab) {
      event.preventDefault();
    }

    const increment = event.shiftKey ? 10 : 1;

    switch (event.key) {
      case Key.ArrowUp:
        is_adjusting_saturation.current = false;
        state.rotate_v(increment);
        break;
      case Key.ArrowDown:
        is_adjusting_saturation.current = false;
        state.rotate_v(-increment);
        break;
      case Key.ArrowLeft:
        is_adjusting_saturation.current = true;
        state.rotate_s(-increment);
        break;
      case Key.ArrowRight:
        is_adjusting_saturation.current = true;
        state.rotate_s(increment);
        break;
      case Key.Home:
        is_adjusting_saturation.current = true;
        state.set_s(0);
        break;
      case Key.End:
        is_adjusting_saturation.current = true;
        state.set_s(SV_MAX);
        break;
      case Key.PageUp:
        is_adjusting_saturation.current = false;
        state.set_v(SV_MAX);
        break;
      case Key.PageDown:
        is_adjusting_saturation.current = false;
        state.set_v(0);
        break;
    }
  };

  return {
    container_props: {
      ...slider_props,
      onKeyDown: on_key_down,
      "aria-describedby": description_id,
      id: board_id
    },
    description_props: {
      id: description_id,
      children: aria_description
    }
  };
};
