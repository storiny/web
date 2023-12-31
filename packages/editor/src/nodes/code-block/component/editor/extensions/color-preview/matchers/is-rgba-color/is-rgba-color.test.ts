import { is_rgba_color } from "./is-rgba-color";

const VALID_COLOR_VALUES = [
  "rgb(0 107 128)",
  "RGB(0 107 128)",
  "Rgb(0 107 128)",
  "rgb(0 107 128 / 60%)",
  "rgb(255, 255, 255)",
  "rgba(255, 255, 255)",
  "rgba(255, 255, 255, .5)",
  "rgba(255 255 255 / 0.5)"
];

const INVALID_COLOR_VALUES = [
  "rgb(0 107 128, .5)",
  "rgb(0 107 128 / )",
  "rgb(0, 107, 128 / 60%)",
  "rgba(255, 255, 255, )",
  "rgba(255 255 255 0.5)",
  "rgba(255 255 255 / )"
];

describe("is_rgba_color", () => {
  it.each(VALID_COLOR_VALUES)(
    "returns `true` for valid RGB(A) color string (`%s`)",
    (str) => {
      expect(is_rgba_color(str)).toBeTrue();
    }
  );

  it.each(INVALID_COLOR_VALUES)(
    "returns `false` for invalid RGB(A) color string (`%s`)",
    (str) => {
      expect(is_rgba_color(str)).toBeFalse();
    }
  );
});
