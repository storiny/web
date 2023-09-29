import { RGB_MAX } from "../../constants";
import { normalize_rgb } from "./normalize-rgb";

describe("normalize_rgb", () => {
  it("returns normalized RGB values", () => {
    expect(normalize_rgb({ r: 25, g: 25, b: 25 })).toEqual({
      r: 25,
      g: 25,
      b: 25
    });

    // Lower bound
    expect(normalize_rgb({ r: -25, g: -25, b: -25 })).toEqual({
      r: 0,
      g: 0,
      b: 0
    });

    // Upper bound
    expect(normalize_rgb({ r: 500, g: 500, b: 500 })).toEqual({
      r: RGB_MAX,
      g: RGB_MAX,
      b: RGB_MAX
    });
  });
});
