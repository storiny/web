import { ALPHA_MAX, RGB_MAX } from "../../constants";
import { normalize_rgba } from "./normalize-rgba";

describe("normalize_rgba", () => {
  it("returns normalized RGBA values", () => {
    expect(normalize_rgba({ r: 25, g: 25, b: 25, a: 100 })).toEqual({
      r: 25,
      g: 25,
      b: 25,
      a: 100
    });

    // Lower bound
    expect(normalize_rgba({ r: -25, g: -25, b: -25, a: -25 })).toEqual({
      r: 0,
      g: 0,
      b: 0,
      a: 0
    });

    // Upper bound
    expect(normalize_rgba({ r: 500, g: 500, b: 500, a: 500 })).toEqual({
      r: RGB_MAX,
      g: RGB_MAX,
      b: RGB_MAX,
      a: ALPHA_MAX
    });
  });
});
