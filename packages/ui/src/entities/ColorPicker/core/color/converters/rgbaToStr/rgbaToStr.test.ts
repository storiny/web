import { RGBA } from "../../../types";
import { rgbaToStr } from "./rgbaToStr";

const cases: [RGBA, string][] = [
  [{ r: 128, g: 106, b: 0, a: 45 }, "rgba(128, 106, 0, 0.45)"],
  [{ r: 226, g: 152, b: 152, a: 100 }, "#e29898"]
];

describe("rgbaToStr", () => {
  it.each(cases)("converts `%s` (RGBA) to `%s`", (rgba, str) => {
    expect(rgbaToStr(rgba)).toEqual(str);
  });
});
