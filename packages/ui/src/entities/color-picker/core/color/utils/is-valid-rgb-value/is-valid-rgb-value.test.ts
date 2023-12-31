import { is_valid_rgb_value } from "./is-valid-rgb-value";

describe("is_valid_rgb_value", () => {
  [0, 75, 125, 228].forEach((value) => {
    it(`returns \`true\` for ${value} RGB value`, () => {
      expect(is_valid_rgb_value(value)).toBeTrue();
    });
  });

  [-15, 256, 300, Infinity].forEach((value) => {
    it(`returns \`false\` for ${value} RGB value`, () => {
      expect(is_valid_rgb_value(value)).toBeFalse();
    });
  });
});
