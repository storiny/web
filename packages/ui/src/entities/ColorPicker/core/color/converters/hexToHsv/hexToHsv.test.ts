import { HEX, HSV } from "../../../types";
import { hexToHsv } from "./hexToHsv";

const cases: [HEX, HSV][] = [
  ["#ffd500", { h: 50, s: 100, v: 100 }],
  ["#fff", { h: 0, s: 0, v: 100 }]
];

describe("hexToHsv", () => {
  it.each(cases)("converts `%s` (HEX) to `%s` (HSV)", (hex, hsv) => {
    expect(hexToHsv(hex)).toEqual(hsv);
  });
});
