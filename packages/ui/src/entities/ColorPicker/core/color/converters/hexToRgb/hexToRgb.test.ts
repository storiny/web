import { HEX, RGB } from "../../../types";
import { hexToRgb } from "./hexToRgb";

const cases: [HEX, RGB][] = [
  ["#ffd500", { r: 255, g: 213, b: 0 }],
  ["#fff", { r: 255, g: 255, b: 255 }]
];

describe("hexToRgb", () => {
  it.each(cases)("converts `%s` (HEX) to `%s` (RGB)", (hex, rgb) => {
    expect(hexToRgb(hex)).toEqual(rgb);
  });
});
