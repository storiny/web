import { get_width } from "./get-width";

const get_fixture = (
  width: string | number
): { result: string; segment: string } => ({
  segment: `w@${width}`,
  result: `${width}`
});

const FIXTURES = [
  get_fixture(0),
  get_fixture(24),
  get_fixture(32),
  get_fixture(128),
  get_fixture(256),
  get_fixture(512),
  get_fixture(0.5),
  get_fixture(1e3),
  get_fixture("auto")
];

describe("get_width", () => {
  it.each(FIXTURES)("returns `$result` for `$segment`", ({ segment, result }) =>
    expect(get_width(segment)).toEqual(result)
  );
});
