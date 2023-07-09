import { smallestElementIndex } from "./smallestElementIndex";

describe("smallestElementIndex", () => {
  it("returns the correct index of smallest item", () => {
    expect(smallestElementIndex([8, 4, 6])).toEqual(1);
  });
});
