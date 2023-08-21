import { isSnowflake } from "./isSnowflake";

describe("isSnowflake", () => {
  it("returns `true` for a valid Snowflake ID", () => {
    expect(isSnowflake("1554992843464900608")).toBeTruthy();
  });

  it("returns `false` for an invalid Snowflake ID", () => {
    expect(isSnowflake("1a2b3c4d5e")).toBeFalsy();
  });
});
