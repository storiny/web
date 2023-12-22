import { ImageSize } from "@storiny/shared";

import { get_cdn_url } from "./get-cdn-url";

describe("get_cdn_url", () => {
  it("returns `w@auto` by default", () => {
    expect(get_cdn_url("test")).toEqual(
      `${process.env.NEXT_PUBLIC_CDN_URL}/uploads/w@auto/test`
    );
  });

  it("returns a valid image size", () => {
    expect(get_cdn_url("test", ImageSize.W_32)).toEqual(
      `${process.env.NEXT_PUBLIC_CDN_URL}/uploads/w@32/test`
    );
  });
});
