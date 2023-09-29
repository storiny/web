import { layout_number_to_css } from "./layout-number-to-css";

describe("layoutNumberToCss", () => {
  it("returns correct CSS value", () => {
    expect(layout_number_to_css(Infinity)).toBeUndefined();
    expect(layout_number_to_css(15)).toEqual(15);
  });
});
