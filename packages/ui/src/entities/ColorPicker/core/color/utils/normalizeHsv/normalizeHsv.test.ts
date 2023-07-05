import { HUE_MAX, SV_MAX } from "../../constants";
import { normalizeHsv } from "./normalizeHsv";

describe("normalizeHsv", () => {
  it("returns normalized HSV values", () => {
    expect(normalizeHsv({ h: 25, v: 25, s: 25 })).toEqual({
      h: 25,
      v: 25,
      s: 25
    });

    // Lower bound
    expect(normalizeHsv({ h: -25, v: -25, s: -25 })).toEqual({
      h: 0,
      v: 0,
      s: 0
    });

    // Upper bound
    expect(normalizeHsv({ h: 500, v: 500, s: 500 })).toEqual({
      h: HUE_MAX,
      v: SV_MAX,
      s: SV_MAX
    });
  });
});
