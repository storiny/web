import { isValidRGBValue } from "./isValidRGBValue";

describe("isValidRGBValue", () => {
  [0, 75, 125, 228].forEach((value) => {
    it(`returns \`true\` for ${value} RGB value`, () => {
      expect(isValidRGBValue(value)).toBeTruthy();
    });
  });

  [-15, 256, 300, Infinity].forEach((value) => {
    it(`returns \`false\` for ${value} RGB value`, () => {
      expect(isValidRGBValue(value)).toBeFalsy();
    });
  });
});
