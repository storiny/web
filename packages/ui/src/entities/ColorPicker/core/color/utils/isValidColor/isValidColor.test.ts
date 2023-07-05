import { isValidColor } from "./isValidColor";

describe("isValidColor", () => {
  it("returns `true` for valid color values", () => {
    expect(isValidColor(65, 100, 0)).toBeTruthy();
    expect(isValidColor(0, 100, 0)).toBeTruthy();
    expect(isValidColor(100, 100, 0)).toBeTruthy();
  });

  it("returns `false` for invalid color values", () => {
    expect(isValidColor(105, 100, 0)).toBeFalsy();
    expect(isValidColor(Infinity, 100, 0)).toBeFalsy();
    expect(isValidColor(-10, 100, 0)).toBeFalsy();
  });
});
