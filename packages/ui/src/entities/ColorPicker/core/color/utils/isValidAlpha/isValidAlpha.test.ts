import { isValidAlpha } from "./isValidAlpha";

describe("isValidAlpha", () => {
  [0, 15, 50, 75, 100].forEach((alpha) => {
    it(`returns \`true\` for ${alpha} alpha value`, () => {
      expect(isValidAlpha(alpha)).toBeTruthy();
    });
  });

  [-15, 150, Infinity].forEach((alpha) => {
    it(`returns \`false\` for ${alpha} alpha value`, () => {
      expect(isValidAlpha(alpha)).toBeFalsy();
    });
  });
});
