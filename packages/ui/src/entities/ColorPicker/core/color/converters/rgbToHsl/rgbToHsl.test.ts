import { HSL, RGB } from "../../../types";
import { rgbToHsl } from "./rgbToHsl";

const cases: [RGB, HSL][] = [
  [
    { r: 0, g: 255, b: 0 },
    { h: 120, s: 100, l: 50 }
  ],
  [
    { r: 255, g: 212, b: 0 },
    { h: 49, s: 100, l: 50 }
  ],
  [
    { r: 255, g: 255, b: 255 },
    { h: 0, s: 0, l: 100 }
  ]
];

describe("rgbToHsl", () => {
  it.each(cases)("converts `%s` (RGB) to `%s` (HSL)", (rgb, hsl) => {
    expect(rgbToHsl(rgb)).toEqual(hsl);
  });
});
