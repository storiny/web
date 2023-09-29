import { is_valid_alpha } from "./is-valid-alpha";

describe("is_valid_alpha", () => {
  [0, 15, 50, 75, 100].forEach((alpha) => {
    it(`returns \`true\` for ${alpha} alpha value`, () => {
      expect(is_valid_alpha(alpha)).toBeTruthy();
    });
  });

  [-15, 150, Infinity].forEach((alpha) => {
    it(`returns \`false\` for ${alpha} alpha value`, () => {
      expect(is_valid_alpha(alpha)).toBeFalsy();
    });
  });
});
