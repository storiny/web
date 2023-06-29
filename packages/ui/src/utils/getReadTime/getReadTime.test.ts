import { getReadTime } from "./getReadTime";

describe("getReadTime", () => {
  it("returns valid read time", () => {
    expect(getReadTime(250)).toEqual(1);
  });

  it("returns floored integer value", () => {
    expect(getReadTime(1024)).toEqual(4);
  });

  it("custom wpm", () => {
    expect(getReadTime(2000, 302)).toEqual(6);
  });
});
