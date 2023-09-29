import { HEX, RGB } from "../../../types";
import { hex_to_rgb } from "./hex-to-rgb";

const cases: [HEX, RGB][] = [
  ["#ffd500", { r: 255, g: 213, b: 0 }],
  ["#fff", { r: 255, g: 255, b: 255 }]
];

describe("hex_to_rgb", () => {
  it.each(cases)("converts `%s` (HEX) to `%s` (RGB)", (hex, rgb) => {
    expect(hex_to_rgb(hex)).toEqual(rgb);
  });
});
