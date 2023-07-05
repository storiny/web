import { isValidNum } from "./isValidNum";

const validNumbers = [0, 5, 10, 10e2, 50e3, Infinity];
const invalidNumbers = ["", "x"];

describe("isValidNum", () => {
  validNumbers.forEach((number) => {
    it(`returns \`true\` for valid number \`${number}\``, () => {
      expect(isValidNum(number)).toBeTrue();
    });
  });

  invalidNumbers.forEach((number) => {
    it(`returns \`false\` for invalid number \`${number}\``, () => {
      expect(isValidNum(number)).toBeFalse();
    });
  });
});
