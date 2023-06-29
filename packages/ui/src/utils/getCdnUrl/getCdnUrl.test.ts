import { ImageSize } from "@storiny/shared";

import { getCdnUrl } from "./getCdnUrl";

describe("getCdnUrl", () => {
  it("returns `w@auto` by default", () => {
    expect(getCdnUrl("test")).toEqual(
      `${process.env.NEXT_PUBLIC_CDN_URL}/w@auto/uploads/test`
    );
  });

  it("returns a valid image size", () => {
    expect(getCdnUrl("test", ImageSize.W_32)).toEqual(
      `${process.env.NEXT_PUBLIC_CDN_URL}/w@32/uploads/test`
    );
  });
});
