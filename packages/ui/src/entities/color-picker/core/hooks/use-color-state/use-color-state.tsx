import React from "react";

import { clamp } from "~/utils/clamp";

import { ALPHA_MAX, HUE_MAX, SV_MAX } from "../../color/constants";
import {
  hex_to_rgb,
  hsv_to_hex,
  hsv_to_rgb,
  rgb_to_hex,
  rgb_to_hsv,
  rgba_to_str
} from "../../color/converters";
import {
  is_valid_alpha,
  is_valid_color,
  is_valid_rgb_value
} from "../../color/utils";
import { DEFAULT_COLOR } from "../../default-color";
import { ColorState, RGB, TColor } from "../../types";
import { UseColorStateProps } from "./use-color-state.props";

/**
 * Sets RGB color value
 * @param set_value Action dispatcher
 * @param channel Color channel
 * @param value Color value
 */
const set_rgb_value = (
  set_value: React.Dispatch<React.SetStateAction<TColor>>,
  channel: "r" | "g" | "b",
  value: number
): void => {
  if (is_valid_rgb_value(value)) {
    set_value((prev) => {
      const { r, g, b, a }: TColor = { ...prev, [channel]: value };
      const { h, s, v } = rgb_to_hsv({ r, g, b });
      const hex = rgb_to_hex({ r, g, b }, false);
      const str = rgba_to_str({ r, g, b, a });
      return { r, g, b, a, h, s, v, hex, str };
    });
  }
};

/**
 * Sets HSV color value
 * @param set_value Action dispatcher
 * @param channel Color channel
 * @param value Color value
 * @param max Upper bound
 */
const set_hsv_value = (
  set_value: React.Dispatch<React.SetStateAction<TColor>>,
  channel: "h" | "s" | "v",
  value: number,
  max: number = SV_MAX
): void => {
  if (is_valid_color(value, max)) {
    set_value((prev) => {
      const { h, s, v, a }: TColor = { ...prev, [channel]: value };
      const { r, g, b } = hsv_to_rgb({ h, s, v });
      const hex = rgb_to_hex({ r, g, b }, false);
      const str = rgba_to_str({ r, g, b, a });
      return { h, s, v, r, g, b, a, hex, str };
    });
  }
};

/**
 * Rotates HSV color value
 * @param set_value Action dispatcher
 * @param channel Color channel
 * @param amount Rotation amount
 * @param max Upper bound
 */
const rotate_hsv_value = (
  set_value: React.Dispatch<React.SetStateAction<TColor>>,
  channel: "h" | "s" | "v",
  amount: number,
  max: number = SV_MAX
): void => {
  set_value((prev) => {
    const { h, s, v, a }: TColor = {
      ...prev,
      [channel]: clamp(0, prev[channel] + amount, max)
    };
    const { r, g, b } = hsv_to_rgb({ h, s, v });
    const hex = rgb_to_hex({ r, g, b }, false);
    const str = rgba_to_str({ r, g, b, a });
    return { h, s, v, r, g, b, a, hex, str };
  });
};

/**
 * Hook for using color state
 * @param props
 */
export const use_color_state = (props: UseColorStateProps): ColorState => {
  const { value, default_value, on_change } = props;
  const [color, set_color_state] = React.useState<TColor>(
    default_value || DEFAULT_COLOR
  );

  /**
   * Custom function for handling value updates
   * @param next_value New value
   */
  const set_value: typeof set_color_state = (next_value) => {
    if (typeof on_change === "function") {
      if (typeof value !== "undefined") {
        on_change(
          typeof next_value === "function" ? next_value(color) : next_value
        );
        // If value is provided then it's controlled, so stop excuting and
        // don't update the internal state
        return;
      }

      on_change(
        typeof next_value === "function" ? next_value(color) : next_value
      );
    }

    set_color_state(next_value);
  };

  // Set HSV
  const set_h = (h: number): void => set_hsv_value(set_value, "h", h, HUE_MAX);
  const set_s = (s: number): void => set_hsv_value(set_value, "s", s);
  const set_v = (v: number): void => set_hsv_value(set_value, "v", v);

  // Set SV
  const set_sv = (s: number, v: number): void => {
    if (is_valid_color(s, SV_MAX) && is_valid_color(v, SV_MAX)) {
      set_value((prev) => {
        const { h, a } = prev;
        const { r, g, b } = hsv_to_rgb({ h, s, v });
        const hex = rgb_to_hex({ r, g, b }, false);
        const str = rgba_to_str({ r, g, b, a });
        return { h, s, v, r, g, b, a, hex, str };
      });
    }
  };

  // Set RGB
  const set_r = (r: number): void => set_rgb_value(set_value, "r", r);
  const set_g = (g: number): void => set_rgb_value(set_value, "g", g);
  const set_b = (b: number): void => set_rgb_value(set_value, "b", b);

  // Set alpha
  const set_a = (a: number): void => {
    if (is_valid_alpha(a)) {
      set_value((prev) => {
        const updated = { ...prev, a };
        updated.str = rgba_to_str(updated);
        return updated;
      });
    }
  };

  // Set hex color
  const set_hex = (
    hex: string,
    fallback: RGB = { r: color.r, g: color.g, b: color.b }
  ): void => {
    set_value(({ a }) => {
      const { r, g, b } = hex_to_rgb(hex, fallback);
      const { h, s, v } = rgb_to_hsv({ r, g, b });
      const str = rgba_to_str({ r, g, b, a });
      return { r, g, b, h, s, v, hex, a, str };
    });
  };

  // Rotate HSV
  const rotate_h = (amount: number): void =>
    rotate_hsv_value(set_value, "h", amount, HUE_MAX);

  const rotate_s = (amount: number): void =>
    rotate_hsv_value(set_value, "s", amount);

  const rotate_v = (amount: number): void =>
    rotate_hsv_value(set_value, "v", amount);

  // Rotate alpha
  const rotate_a = (amount: number): void => {
    set_value((prev) => ({
      ...prev,
      a: clamp(0, prev.a + amount, ALPHA_MAX)
    }));
  };

  React.useEffect(() => {
    if (value) {
      set_color_state(value);
    }
  }, [value]);

  return {
    set_h,
    set_s,
    set_v,
    set_r,
    set_g,
    set_b,
    set_a,
    set_sv,
    set_hex,
    rotate_h,
    rotate_s,
    rotate_v,
    rotate_a,
    color,
    get_solid_color: () => hsv_to_hex({ h: color.h, s: SV_MAX, v: SV_MAX })
  };
};
