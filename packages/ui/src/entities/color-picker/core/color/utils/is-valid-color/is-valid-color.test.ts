import { is_valid_color } from "./is-valid-color";

describe("is_valid_color", () => {
  it("returns `true` for valid color values", () => {
    expect(is_valid_color(65, 100, 0)).toBeTruthy();
    expect(is_valid_color(0, 100, 0)).toBeTruthy();
    expect(is_valid_color(100, 100, 0)).toBeTruthy();
  });

  it("returns `false` for invalid color values", () => {
    expect(is_valid_color(105, 100, 0)).toBeFalsy();
    expect(is_valid_color(Infinity, 100, 0)).toBeFalsy();
    expect(is_valid_color(-10, 100, 0)).toBeFalsy();
  });
});
