import { capitalize } from "./capitalize";

describe("capitalize", () => {
  it("capitalizes lowercase string", () => {
    expect(capitalize("test")).toEqual("Test");
    expect(capitalize("some string")).toEqual("Some string");
  });

  it("capitalizes the first letter and lower-cases the rest", () => {
    expect(capitalize("teST")).toEqual("Test");
    expect(capitalize("some String")).toEqual("Some string");
  });

  it("skips strings that are already capitalized", () => {
    expect(capitalize("Test")).toEqual("Test");
    expect(capitalize("ALLCAPS")).toEqual("Allcaps");
  });

  it("skips non-alpha characters", () => {
    expect(capitalize("1number")).toEqual("1number");
    expect(capitalize("!important")).toEqual("!important");
    expect(capitalize(" whitespace")).toEqual(" whitespace");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toEqual("");
  });
});
