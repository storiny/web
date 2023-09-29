import { HUE_MAX, SV_MAX } from "../../constants";
import { normalize_hsv } from "./normalize-hsv";

describe("normalize_hsv", () => {
  it("returns normalized HSV values", () => {
    expect(normalize_hsv({ h: 25, v: 25, s: 25 })).toEqual({
      h: 25,
      v: 25,
      s: 25
    });

    // Lower bound
    expect(normalize_hsv({ h: -25, v: -25, s: -25 })).toEqual({
      h: 0,
      v: 0,
      s: 0
    });

    // Upper bound
    expect(normalize_hsv({ h: 500, v: 500, s: 500 })).toEqual({
      h: HUE_MAX,
      v: SV_MAX,
      s: SV_MAX
    });
  });
});
