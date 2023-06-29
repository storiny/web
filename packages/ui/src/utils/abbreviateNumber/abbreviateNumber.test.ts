import { abbreviateNumber } from "./abbreviateNumber";

describe("abbreviateNumber", () => {
  (
    [
      [0, "0"],
      [5, "5"],
      [10, "10"],
      [1e2, "100"],
      [1e3, "1k"],
      [1600, "1.6k"],
      [12e3, "12k"],
      [10e4, "100k"],
      [10e5, "1M"],
      [10e6, "10M"],
      [10e7, "100M"],
      [10e8, "1B"],
      [10e9, "10B"],
      [10e10, "100B"],
      [10e11, "1T"],
      [10e12, "10T"],
      [10e13, "100T"],
      [10e14, "1P"],
      [10e15, "10P"],
      [10e16, "100P"],
      [10e17, "1E"],
      [10e18, "10E"],
      [10e19, "100E"],
    ] as [number, string][]
  ).forEach(([number, expected]) => {
    it(`abbreviates ${number} to ${expected}`, () => {
      expect(abbreviateNumber(number)).toEqual(expected);
    });
  });
});
