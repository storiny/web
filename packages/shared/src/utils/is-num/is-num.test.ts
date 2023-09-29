import { is_num } from "./is-num";

describe("is_num", () => {
  [0, 10, 25, 10e2, 50e3, Infinity].forEach((test_case) => {
    it(`returns \`true\` for \`${test_case}\``, () => {
      expect(is_num(test_case)).toBeTruthy();
    });
  });

  [0, 10, 25, "", "x"].map(String).forEach((test_case) => {
    it(`returns \`false\` for \`${test_case}\` (string)`, () => {
      expect(is_num(test_case)).toBeTruthy();
    });
  });
});
