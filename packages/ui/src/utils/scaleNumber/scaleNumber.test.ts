import { scaleNumber } from "./scaleNumber";

describe("scaleNumber", () => {
  const scale = scaleNumber(0, 100, 0, 50);

  it("scales a number", () => {
    expect(scale(50)).toEqual(25);
  });
});
