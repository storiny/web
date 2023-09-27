"use client";

import React from "react";

import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";

import { ALPHA_MAX } from "../../color/constants";
import { cssColor } from "../../color/cssColor";
import { ParamsProps } from "./Params.props";

type Mode = "hex" | "rgb" | "hsv";

const modes: Mode[] = ["hex", "rgb", "hsv"];

const Params = (props: ParamsProps): React.ReactElement => {
  const { state } = props;
  const [mode, setMode] = React.useState<Mode>("hex");
  const [value, setValue] = React.useState<string>(`#${state.color.hex}`);
  const [valid, setValid] = React.useState<boolean>(true);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const nextValue = event.target.value;
      setValue(nextValue);

      if (mode === "hex") {
        setValid(true);
        state.setHex(nextValue.substring(1)); // Remove #
      } else {
        const rgba = cssColor(nextValue);

        if (rgba) {
          setValid(true);

          state.setR(rgba.r);
          state.setG(rgba.g);
          state.setB(rgba.b);
          state.setA(rgba.a);
        } else {
          setValid(false);
        }
      }
    },
    [mode, state]
  );

  // Overwrite user input on state change
  React.useEffect(() => {
    setValid(true);
    setValue(
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
      endDecorator={
        <Select
          onValueChange={(newMode): void => setMode(newMode as Mode)}
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
          {modes.map((item) => (
            <Option key={item} value={item}>
              {item.toUpperCase()}
            </Option>
          ))}
        </Select>
      }
      onChange={handleChange}
      placeholder={"Color value"}
      value={value}
    />
  );
};

export default React.memo(Params);
