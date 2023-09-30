import { act } from "@testing-library/react";

import { render_hook_with_provider } from "~/redux/test-utils";

import { TColor } from "../../types";
import { use_color_state } from "./use-color-state";

const DEFAULT_VALUE: TColor = {
  h: 223,
  s: 21,
  v: 13,
  a: 100,
  r: 27,
  g: 29,
  b: 34,
  hex: "1B1D22",
  str: "#1B1D22"
};

describe("use_color_state", () => {
  it("initializes with a default value", () => {
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE
      })
    );

    expect(result.current.color.hex).toEqual(DEFAULT_VALUE.hex);
  });

  it("invokes `onChange` callback function with valid values", async () => {
    const on_change = jest.fn();
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE,
        on_change
      })
    );

    act(() => {
      result.current.set_a(75);
    });

    expect(on_change).toHaveBeenCalledWith({
      ...DEFAULT_VALUE,
      str: "rgba(27, 29, 34, 0.75)",
      a: 75
    });
  });

  it("computes solid color value", () => {
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE
      })
    );

    expect(result.current.get_solid_color()).toEqual("#0048ff");
  });

  it("assigns RGB color values", async () => {
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE
      })
    );

    act(() => {
      result.current.set_r(25);
      result.current.set_g(25);
      result.current.set_b(25);
    });
    const { r, g, b } = result.current.color;

    expect({ r, g, b }).toEqual({
      r: 25,
      g: 25,
      b: 25
    });
  });

  it("assigns HSV color values", async () => {
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE
      })
    );

    act(() => {
      result.current.set_h(25);
      result.current.set_s(25);
      result.current.set_v(25);
    });
    const { h, s, v } = result.current.color;

    expect({ h, s, v }).toEqual({
      h: 25,
      s: 25,
      v: 25
    });
  });

  it("assigns alpha and saturation color values", async () => {
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE
      })
    );

    act(() => {
      result.current.set_a(75);
      result.current.set_sv(25, 50);
    });

    const { a, s, v } = result.current.color;

    expect({ a, s, v }).toEqual({
      a: 75,
      s: 25,
      v: 50
    });
  });

  it("assigns hex color value", async () => {
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE
      })
    );

    act(() => {
      result.current.set_hex("#ffffff");
    });

    expect(result.current.color.hex).toEqual("#ffffff");
  });

  it("rotates HSVA color values", async () => {
    const { result } = render_hook_with_provider(() =>
      use_color_state({
        default_value: DEFAULT_VALUE
      })
    );

    const { rotate_v, rotate_s, rotate_a, rotate_h } = result.current;
    act(() => {
      rotate_h(25);
      rotate_s(25);
      rotate_v(25);
      rotate_a(-25);
    });
    const { h, s, v, a } = result.current.color;

    expect({ h, s, v, a }).toEqual({
      h: DEFAULT_VALUE.h + 25,
      s: DEFAULT_VALUE.s + 25,
      v: DEFAULT_VALUE.v + 25,
      a: DEFAULT_VALUE.a - 25
    });
  });
});
