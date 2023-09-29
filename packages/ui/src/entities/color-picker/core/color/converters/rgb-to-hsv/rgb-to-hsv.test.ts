import { HSV, RGB } from "../../../types";
import { rgb_to_hsv } from "./rgb-to-hsv";

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

describe("rgb_to_hsv", () => {
  it.each(cases)("converts `%s` (RGB) to `%s` (HSV)", (rgb, hsv) => {
    expect(rgb_to_hsv(rgb)).toEqual(hsv);
  });
});
