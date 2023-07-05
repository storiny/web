import { HSV, RGB } from "../../../types";
import { hsvToRgb } from "./hsvToRgb";

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

describe("hsvToRgb", () => {
  it.each(cases)("converts `%s` (HSV) to `%s` (RGB)", (hsv, rgb) => {
    expect(hsvToRgb(hsv)).toEqual(rgb);
  });
});
