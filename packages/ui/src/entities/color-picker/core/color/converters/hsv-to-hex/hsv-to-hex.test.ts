import { HEX, HSV } from "../../../types";
import { hsv_to_hex } from "./hsv-to-hex";

const cases: [HSV, HEX][] = [
  [{ h: 120, s: 100, v: 100 }, "#00ff00"],
  [{ h: 50, s: 100, v: 100 }, "#ffd400"],
  [{ h: 0, s: 0, v: 100 }, "#ffffff"]
];

describe("hsv_to_hex", () => {
  it.each(cases)("converts `%s` (HSV) to `%s` (HEX)", (hsv, hex) => {
    expect(hsv_to_hex(hsv)).toEqual(hex);
  });
});
