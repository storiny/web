import { act } from "@testing-library/react";

import { render_hook_with_provider } from "src/redux/test-utils";

import { TColor } from "../../types";
import { useColorState } from "./useColorState";

const defaultValue: TColor = {
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

describe("useColorState", () => {
  it("initializes with a default value", () => {
    const { result } = render_hook_with_provider(() =>
      useColorState({
        defaultValue
      })
    );

    expect(result.current.color.hex).toEqual(defaultValue.hex);
  });

  it("invokes `onChange` callback function with valid values", async () => {
    const onChange = jest.fn();
    const { result } = render_hook_with_provider(() =>
      useColorState({
        defaultValue,
        onChange
      })
    );

    await act(() => {
      result.current.setA(75);
    });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultValue,
      str: "rgba(27, 29, 34, 0.75)",
      a: 75
    });
  });

  it("computes solid color value", () => {
    const { result } = render_hook_with_provider(() =>
      useColorState({
        defaultValue
      })
    );

    expect(result.current.getSolidColor()).toEqual("#0048ff");
  });

  it("assigns RGB color values", async () => {
    const { result } = render_hook_with_provider(() =>
      useColorState({
        defaultValue
      })
    );

    await act(() => {
      result.current.setR(25);
      result.current.setG(25);
      result.current.setB(25);
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
      useColorState({
        defaultValue
      })
    );

    await act(() => {
      result.current.setH(25);
      result.current.setS(25);
      result.current.setV(25);
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
      useColorState({
        defaultValue
      })
    );

    await act(() => {
      result.current.setA(75);
      result.current.setSV(25, 50);
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
      useColorState({
        defaultValue
      })
    );

    await act(() => {
      result.current.setHex("#ffffff");
    });

    expect(result.current.color.hex).toEqual("#ffffff");
  });

  it("rotates HSVA color values", async () => {
    const { result } = render_hook_with_provider(() =>
      useColorState({
        defaultValue
      })
    );

    const { rotateV, rotateS, rotateA, rotateH } = result.current;

    await act(() => {
      rotateH(25);
      rotateS(25);
      rotateV(25);
      rotateA(-25);
    });

    const { h, s, v, a } = result.current.color;

    expect({ h, s, v, a }).toEqual({
      h: defaultValue.h + 25,
      s: defaultValue.s + 25,
      v: defaultValue.v + 25,
      a: defaultValue.a - 25
    });
  });
});
