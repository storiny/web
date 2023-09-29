import { TColor } from "../../types";
import { str_to_color } from "./str-to-color";

describe("str_to_color", () => {
  it("converts CSS color string to a color object", () => {
    expect(str_to_color("hsla(0, 0, 100, 1)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      v: 100,
      hex: "ffffff",
      h: 0,
      str: "hsla(0, 0, 100, 1)",
      s: 0,
      a: 100
    } as TColor);
  });
});
