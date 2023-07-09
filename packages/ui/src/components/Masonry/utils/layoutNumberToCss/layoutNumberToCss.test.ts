import { layoutNumberToCss } from "./layoutNumberToCss";

describe("layoutNumberToCss", () => {
  it("returns correct CSS value", () => {
    expect(layoutNumberToCss(Infinity)).toBeUndefined();
    expect(layoutNumberToCss(15)).toEqual(15);
  });
});
