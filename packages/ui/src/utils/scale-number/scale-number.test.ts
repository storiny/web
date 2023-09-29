import { scale_number } from "./scale-number";

describe("scale_number", () => {
  const scale = scale_number(0, 100, 0, 50);

  it("scales a number", () => {
    expect(scale(50)).toEqual(25);
  });
});
