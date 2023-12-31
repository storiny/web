import { is_bool } from "./is-bool";

describe("is_bool", () => {
  [true, false].forEach((test_case) => {
    it(`returns \`true\` for \`${test_case}\``, () => {
      expect(is_bool(test_case)).toBeTrue();
    });
  });
});
