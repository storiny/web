import { TColor } from "../../types";
import { strToColor } from "./strToColor";

describe("strToColor", () => {
  it("converts CSS color string to a color object", () => {
    expect(strToColor("hsla(0, 0, 100, 1)")).toEqual({
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
