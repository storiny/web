import { HSV, RGB } from "../../../types";
import { hsv_to_rgb } from "./hsv-to-rgb";

const cases: [HSV, RGB][] = [
  [
    { h: 120, s: 100, v: 100 },
    { r: 0, g: 255, b: 0 }
  ],
  [
    { h: 50, s: 100, v: 50 },
    { r: 127, g: 106, b: 0 }
  ],
  [
    { h: 0, s: 0, v: 100 },
    { r: 255, g: 255, b: 255 }
  ]
];

describe("hsv_to_rgb", () => {
  it.each(cases)("converts `%s` (HSV) to `%s` (RGB)", (hsv, rgb) => {
    expect(hsv_to_rgb(hsv)).toEqual(rgb);
  });
});
