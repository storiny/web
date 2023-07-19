import { getItemsPosition } from "./getItemsPosition";

const stubCache = (
  measurements: { [item: string]: number } = {}
): {
  get: (item: string) => number;
  has: (item: string) => boolean;
  reset: () => void;
  set: (item: string, value: number) => void;
} => {
  let cache = measurements;

  return {
    get: (item: string): number => cache[item],
    has: (item: string): boolean => !!cache[item],
    set: (item: string, value: number): void => {
      cache[item] = value;
    },
    reset: (): void => {
      cache = {};
    }
  };
};

describe("getItemsPosition", () => {
  it("handles empty layout", () => {
    const positions = getItemsPosition({
      cache: stubCache(),
      width: 500
    });

    expect(positions([])).toEqual([]);
  });

  it("handles layout with a single row", () => {
    const measurements = { a: 100, b: 120, c: 80 };
    const items = ["a", "b", "c"];
    const layout = getItemsPosition({
      cache: stubCache(measurements),
      width: 900
    });

    expect(layout(items)).toEqual([
      { top: 0, height: 100, left: 0, width: 300 },
      { top: 0, height: 120, left: 300, width: 300 },
      { top: 0, height: 80, left: 600, width: 300 }
    ]);
  });

  it("handles wrapping items", () => {
    const measurements = { a: 100, b: 120, c: 80, d: 100 };
    const items = ["a", "b", "c", "d"];
    const layout = getItemsPosition({
      cache: stubCache(measurements),
      width: 500
    });

    expect(layout(items)).toEqual([
      { top: 0, height: 100, left: 0, width: 250 },
      { top: 0, height: 120, left: 250, width: 250 },
      { top: 100, height: 80, left: 0, width: 250 },
      { top: 120, height: 100, left: 250, width: 250 }
    ]);
  });
});
