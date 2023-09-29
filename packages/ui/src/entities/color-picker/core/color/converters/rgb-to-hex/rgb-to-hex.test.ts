import { HEX, RGB } from "../../../types";
import { rgb_to_hex } from "./rgb-to-hex";

const cases: [RGB, HEX][] = [
  [{ r: 0, g: 255, b: 0 }, "#00ff00"],
  [{ r: 255, g: 213, b: 0 }, "#ffd500"],
  [{ r: 255, g: 255, b: 255 }, "#ffffff"]
];

describe("rgb_to_hex", () => {
  // With #
  it.each(cases)("converts `%s` (RGB) to `%s` (HEX)", (rgb, hex) => {
    expect(rgb_to_hex(rgb)).toEqual(hex);
  });

  // Without #
  it.each(cases)("converts `%s` (RGB) to `%s` (HEX)", (rgb, hex) => {
    expect(rgb_to_hex(rgb, false)).toEqual(hex.substring(1));
  });
});
