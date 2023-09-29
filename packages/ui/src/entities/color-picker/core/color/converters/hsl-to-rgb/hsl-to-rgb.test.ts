import { HSL, RGB } from "../../../types";
import { hsl_to_rgb } from "./hsl-to-rgb";

const cases: [HSL, RGB][] = [
  [
    { h: 120, s: 100, l: 50 },
    { r: 0, g: 255, b: 0 }
  ],
  [
    { h: 50, s: 100, l: 50 },
    { r: 255, g: 212, b: 0 }
  ],
  [
    { h: 0, s: 0, l: 100 },
    { r: 255, g: 255, b: 255 }
  ]
];

describe("hsl_to_rgb", () => {
  it.each(cases)("converts `%s` (HSL) to `%s` (RGB)", (hsl, rgb) => {
    expect(hsl_to_rgb(hsl)).toEqual(rgb);
  });
});
