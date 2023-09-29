import { RGBA } from "../../types";
import { css_color } from "./css-color";

const CSS_COLORS: [string, RGBA][] = [
  // RGB(A)
  ["rgb(25, 25, 25)", { r: 25, b: 25, g: 25, a: 100 }],
  ["rgba(25, 25, 25, 1)", { r: 25, b: 25, g: 25, a: 100 }],
  ["rgba(25, 25, 25, 0.75)", { r: 25, b: 25, g: 25, a: 75 }],
  ["rgba(255, 255, 255, -10)", { r: 255, b: 255, g: 255, a: 0 }],
  ["rgba(255, 255, 255, 500)", { r: 255, b: 255, g: 255, a: 100 }],
  // HEX
  ["#ffffff", { r: 255, b: 255, g: 255, a: 100 }],
  ["#fff", { r: 255, b: 255, g: 255, a: 100 }],
  // HSL(A)
  ["hsl(0, 0, 98)", { r: 249, b: 249, g: 249, a: 100 }],
  ["hsla(0, 0, 98, 1)", { r: 249, b: 249, g: 249, a: 100 }],
  ["hsla(0, 0, 98, 0.75)", { r: 249, b: 249, g: 249, a: 75 }],
  ["hsla(0, 0, 100, 500)", { r: 255, b: 255, g: 255, a: 100 }]
];

describe("css_color", () => {
  CSS_COLORS.forEach(([color, expected]) => {
    it(`parses ${color} color`, () => {
      expect(css_color(color)).toEqual(expected);
    });
  });
});
