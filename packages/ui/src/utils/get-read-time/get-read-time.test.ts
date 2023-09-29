import { get_read_time } from "./get-read-time";

describe("get_read_time", () => {
  it("returns valid read time", () => {
    expect(get_read_time(250)).toEqual(1);
  });

  it("returns floored integer value", () => {
    expect(get_read_time(1024)).toEqual(4);
  });

  it("custom wpm", () => {
    expect(get_read_time(2000, 302)).toEqual(6);
  });
});
