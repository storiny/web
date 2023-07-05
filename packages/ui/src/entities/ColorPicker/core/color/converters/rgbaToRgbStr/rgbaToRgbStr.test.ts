import { RGBA } from "../../../types";
import { rgbaToRgbStr } from "./rgbaToRgbStr";

const cases: [RGBA, string][] = [
  [{ r: 0, g: 255, b: 0, a: 100 }, "rgba(0, 255, 0, 1)"],
  [{ r: 128, g: 106, b: 0, a: 45 }, "rgba(128, 106, 0, 0.45)"],
  [{ r: 255, g: 255, b: 255 } as any, "rgb(255, 255, 255)"] // Ignore alpha
];

describe("rgbaToRgbStr", () => {
  it.each(cases)("converts `%s` (RGBA) to `%s`", (rgba, str) => {
    expect(rgbaToRgbStr(rgba)).toEqual(str);
  });
});
