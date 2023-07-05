import { isValidHex } from "./isValidHex";

const colors = [
  // 6 digit
  "#afebe3",
  "#AFEBE3",
  "#3cb371",
  "#3CB371",
  "#556b2f",
  // 3 digit
  "#777",
  "#FFF",
  "#fff",
  "#f3f",
  "#111"
];

describe("isValidHex", () => {
  colors.forEach((color) => {
    it(`returns \`true\` for valid color \`${color}\``, () => {
      expect(isValidHex(color)).toBeTrue();
    });
  });
});
