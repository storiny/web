import { smallest_element_index } from "./smallest-element-index";

describe("smallest_element_index", () => {
  it("returns the correct index of smallest item", () => {
    expect(smallest_element_index([8, 4, 6])).toEqual(1);
  });
});
