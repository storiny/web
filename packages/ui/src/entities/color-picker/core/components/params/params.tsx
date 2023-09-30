"use client";

import React from "react";

import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";

import { ALPHA_MAX } from "../../color/constants";
import { css_color } from "../../color/css-color";
import { ParamsProps } from "./params.props";

type Mode = "hex" | "rgb" | "hsv";

const MODES: Mode[] = ["hex", "rgb", "hsv"];

const Params = (props: ParamsProps): React.ReactElement => {
  const { state } = props;
  const [mode, set_mode] = React.useState<Mode>("hex");
  const [value, set_value] = React.useState<string>(`#${state.color.hex}`);
  const [valid, set_valid] = React.useState<boolean>(true);

  const handle_change = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const next_value = event.target.value;
      set_value(next_value);

      if (mode === "hex") {
        set_valid(true);
        state.set_hex(next_value.substring(1)); // Remove #
      } else {
        const rgba = css_color(next_value);

        if (rgba) {
          set_valid(true);
          state.set_r(rgba.r);
          state.set_g(rgba.g);
          state.set_b(rgba.b);
          state.set_a(rgba.a);
        } else {
          set_valid(false);
        }
      }
    },
    [mode, state]
  );

  // Overwrite user input on state change
  React.useEffect(() => {
    set_valid(true);
    set_value(
      mode === "rgb"
        ? `rgba(${state.color.r}, ${state.color.g}, ${state.color.b}, ${
            state.color.a / ALPHA_MAX
          })`
        : mode === "hsv"
        ? `hsva(${state.color.h}, ${state.color.s}, ${state.color.v}, ${
            state.color.a / ALPHA_MAX
          })`
        : `#${state.color.hex}`
    );
  }, [
    mode,
    state.color.r,
    state.color.g,
    state.color.b,
    state.color.a,
    state.color.hex,
    state.color.h,
    state.color.s,
    state.color.v
  ]);

  return (
    <Input
      aria-label={"Color value"}
      color={valid ? "inverted" : "ruby"}
      end_decorator={
        <Select
          onValueChange={(next_mode): void => set_mode(next_mode as Mode)}
          slot_props={{
            content: {
              style: {
                zIndex: "calc(var(--z-index-popover) + 1)"
              }
            },
            value: { placeholder: "Color value format" },
            trigger: {
              "aria-label": "Change color format"
            }
          }}
          value={mode}
        >
          {MODES.map((item) => (
            <Option key={item} value={item}>
              {item.toUpperCase()}
            </Option>
          ))}
        </Select>
      }
      onChange={handle_change}
      placeholder={"Color value"}
      value={value}
    />
  );
};

export default React.memo(Params);
