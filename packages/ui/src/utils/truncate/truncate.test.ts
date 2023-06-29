import { truncate } from "./truncate";

describe("truncate", () => {
  it("truncates a string", () => {
    expect(truncate("A very long string", 16)).toEqual("A very long str…");
    expect(truncate("A short string", 100)).toEqual("A short string");
  });

  it("truncates a string with custom delimiter", () => {
    expect(truncate("A very long string", 16, "$$$")).toEqual(
      "A very long str$$$"
    );
  });
});
