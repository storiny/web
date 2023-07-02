import { capitalize } from "~/utils/capitalize";

import { DateFormat, dayjs, formatDate } from "./formatDate";

type Fixture = {
  expected: string;
  format: DateFormat | null;
  value: Parameters<typeof formatDate>[0];
};

type RelativeFixture = {
  expected: string;
  unit: dayjs.ManipulateType;
  value: number;
};

const fixtures: Array<Fixture> = [
  {
    expected: "Dec 2, 2022",
    format: DateFormat.STANDARD,
    value: new Date("2022-12-02")
  },
  {
    expected: "Dec 14, 2022",
    format: DateFormat.STANDARD,
    value: new Date("2022-12-14")
  },
  {
    expected: "Dec 2",
    format: DateFormat.SHORT,
    value: new Date("2022-12-02")
  },
  {
    expected: "Dec 14",
    format: DateFormat.SHORT,
    value: new Date("2022-12-14")
  },
  {
    expected: "Dec 2, 2022 8:24 AM",
    format: DateFormat.LONG,
    value: new Date(2022, 11, 2, 8, 24)
  },
  {
    expected: "Dec 2, 2022 5:24 PM",
    format: DateFormat.LONG,
    value: new Date(2022, 11, 2, 17, 24)
  },
  {
    expected: "Dec 14, 2022 8:24 AM",
    format: DateFormat.LONG,
    value: new Date(2022, 11, 14, 8, 24)
  },
  {
    expected: "Dec 14, 2022 5:24 PM",
    format: DateFormat.LONG,
    value: new Date(2022, 11, 14, 17, 24)
  }
];

const relativeFixtures: Array<RelativeFixture> = [
  {
    expected: "a few seconds ago",
    unit: "second",
    value: 0
  },
  {
    expected: "a few seconds ago",
    unit: "second",
    value: 1
  },
  {
    expected: "a few seconds ago",
    unit: "second",
    value: 44
  },
  {
    expected: "a few seconds ago",
    unit: "second",
    value: 44.4
  },
  {
    expected: "a minute ago",
    unit: "second",
    value: 44.5
  },
  {
    expected: "a minute ago",
    unit: "second",
    value: 45
  },
  {
    expected: "a minute ago",
    unit: "minute",
    value: 1
  },
  {
    expected: "a minute ago",
    unit: "second",
    value: 89
  },
  {
    expected: "a minute ago",
    unit: "second",
    value: 89.4
  },
  {
    expected: "a minute ago",
    unit: "second",
    value: 89.5
  },
  {
    expected: "2 minutes ago",
    unit: "second",
    value: 90
  },
  {
    expected: "44 minutes ago",
    unit: "minute",
    value: 44
  },
  {
    expected: "44 minutes ago",
    unit: "minute",
    value: 44.4
  },
  {
    expected: "an hour ago",
    unit: "minute",
    value: 44.5
  },
  {
    expected: "an hour ago",
    unit: "minute",
    value: 45
  },
  {
    expected: "an hour ago",
    unit: "hour",
    value: 1
  },
  {
    expected: "an hour ago",
    unit: "minute",
    value: 89
  },
  {
    expected: "an hour ago",
    unit: "minute",
    value: 89.4
  },
  {
    expected: "an hour ago",
    unit: "minute",
    value: 89.5
  },
  {
    expected: "2 hours ago",
    unit: "minute",
    value: 90
  },
  {
    expected: "21 hours ago",
    unit: "hour",
    value: 21
  },
  {
    expected: "21 hours ago",
    unit: "hour",
    value: 21.4
  },
  {
    expected: "a day ago",
    unit: "hour",
    value: 21.5
  },
  {
    expected: "a day ago",
    unit: "hour",
    value: 22
  },
  {
    expected: "a day ago",
    unit: "day",
    value: 1
  },
  {
    expected: "a day ago",
    unit: "hour",
    value: 35
  },
  {
    expected: "a day ago",
    unit: "hour",
    value: 35.4
  },
  {
    expected: "a day ago",
    unit: "hour",
    value: 35.5
  },
  {
    expected: "2 days ago",
    unit: "hour",
    value: 36
  },
  {
    expected: "25 days ago",
    unit: "day",
    value: 25
  },
  {
    expected: "a month ago",
    unit: "day",
    value: 26
  },
  {
    expected: "a month ago",
    unit: "month",
    value: 1
  },
  {
    expected: "a month ago",
    unit: "day",
    value: 45
  },
  {
    expected: "2 months ago",
    unit: "day",
    value: 47
  },
  {
    expected: "10 months ago",
    unit: "month",
    value: 10
  },
  {
    expected: "a year ago",
    unit: "month",
    value: 11
  },
  {
    expected: "a year ago",
    unit: "year",
    value: 1
  },
  {
    expected: "a year ago",
    unit: "month",
    value: 17
  },
  {
    expected: "2 years ago",
    unit: "month",
    value: 18
  }
];

describe("formatDate", () => {
  test.each(fixtures)(
    "formats date with $format format: $expected",
    ({ value, format, expected }) =>
      expect(formatDate(value, format || undefined)).toEqual(expected)
  );

  test.each([
    ...relativeFixtures.map((fixture) => ({
      ...fixture,
      format: DateFormat.RELATIVE
    })),
    ...relativeFixtures.map(({ expected, ...rest }) => ({
      ...rest,
      expected: capitalize(expected),
      format: DateFormat.RELATIVE_CAPITALIZED
    }))
  ])(
    "formats date with $format format: $expected",
    ({ value, unit, format, expected }) =>
      expect(
        formatDate(dayjs().subtract(value, unit), format || undefined)
      ).toEqual(expected)
  );
});
