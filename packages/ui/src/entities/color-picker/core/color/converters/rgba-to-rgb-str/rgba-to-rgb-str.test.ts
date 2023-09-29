import { RGBA } from "../../../types";
import { rgba_to_rgb_str } from "./rgba-to-rgb-str";

const cases: [RGBA, string][] = [
  [{ r: 0, g: 255, b: 0, a: 100 }, "rgba(0, 255, 0, 1)"],
  [{ r: 128, g: 106, b: 0, a: 45 }, "rgba(128, 106, 0, 0.45)"],
  [{ r: 255, g: 255, b: 255 } as any, "rgb(255, 255, 255)"] // Ignore alpha
];

describe("rgba_to_rgb_str", () => {
  it.each(cases)("converts `%s` (RGBA) to `%s`", (rgba, str) => {
    expect(rgba_to_rgb_str(rgba)).toEqual(str);
  });
});
