import { is_snowflake } from "./is-snowflake";

describe("is_snowflake", () => {
  it("returns `true` for a valid Snowflake ID", () => {
    expect(is_snowflake("1554992843464900608")).toBeTrue();
  });

  it("returns `false` for an invalid Snowflake ID", () => {
    expect(is_snowflake("1a2b3c4d5e")).toBeFalse();
  });
});
