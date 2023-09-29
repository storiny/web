import { RGBA } from "../../../types";
import { rgba_to_str } from "./rgba-to-str";

const cases: [RGBA, string][] = [
  [{ r: 128, g: 106, b: 0, a: 45 }, "rgba(128, 106, 0, 0.45)"],
  [{ r: 226, g: 152, b: 152, a: 100 }, "#e29898"]
];

describe("rgba_to_str", () => {
  it.each(cases)("converts `%s` (RGBA) to `%s`", (rgba, str) => {
    expect(rgba_to_str(rgba)).toEqual(str);
  });
});
