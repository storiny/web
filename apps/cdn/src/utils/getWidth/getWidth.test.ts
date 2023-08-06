import { getWidth } from "./getWidth";

const getFixture = (
  width: string | number
): { result: string; segment: string } => ({
  segment: `w@${width}`,
  result: `${width}`
});

const fixtures = [
  getFixture(0),
  getFixture(24),
  getFixture(32),
  getFixture(128),
  getFixture(256),
  getFixture(512),
  getFixture(0.5),
  getFixture(1e3),
  getFixture("auto")
];

describe("getWidth", () => {
  it.each(fixtures)("returns `$result` for `$segment`", ({ segment, result }) =>
    expect(getWidth(segment)).toEqual(result)
  );
});
