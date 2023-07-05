import { HSV, RGB } from "../../../types";
import { rgbToHsv } from "./rgbToHsv";

const cases: [RGB, HSV][] = [
  [
    { r: 0, g: 255, b: 0 },
    { h: 120, s: 100, v: 100 }
  ],
  [
    { r: 127, g: 106, b: 0 },
    { h: 50, s: 100, v: 49 }
  ],
  [
    { r: 255, g: 255, b: 255 },
    { h: 0, s: 0, v: 100 }
  ]
];

describe("rgbToHsv", () => {
  it.each(cases)("converts `%s` (RGB) to `%s` (HSV)", (rgb, hsv) => {
    expect(rgbToHsv(rgb)).toEqual(hsv);
  });
});
