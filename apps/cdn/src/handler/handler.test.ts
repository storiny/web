import { ImageSize } from "@storiny/shared";

import { baseBucket, handler, uploadsBucket } from "./handler";

const imageSizes = Object.values(ImageSize).filter(
  (value) => typeof value === "number"
);

const r: Partial<Omit<NginxHTTPRequest, "uri">> & { uri: string } = {
  uri: "",
  return: jest.fn(),
  internalRedirect: jest.fn(),
  variables: {},
  headersOut: {},
};

describe("handler", () => {
  let reqObj = r;

  beforeEach(() => {
    reqObj = r;
  });

  it("uses base bucket for single segment", () => {
    reqObj.uri = "/object_key";
    handler(reqObj as NginxHTTPRequest);

    expect(reqObj.variables?.proxy_rewrite).toEqual(
      `internal/plain/${baseBucket}/object_key`
    );
    expect(reqObj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("uses uploads bucket", () => {
    reqObj.uri = "/uploads/object_key";
    handler(reqObj as NginxHTTPRequest);

    expect(reqObj.variables?.proxy_rewrite).toEqual(
      `internal/plain/${uploadsBucket}/object_key`
    );
    expect(reqObj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("uses download option", () => {
    reqObj.uri = "/dl/object_key";
    handler(reqObj as NginxHTTPRequest);

    expect(reqObj.variables?.proxy_rewrite).toEqual(
      `internal/return_attachment:true/plain/${uploadsBucket}/object_key`
    );
    expect(reqObj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("ignores size for download option", () => {
    reqObj.uri = "/dl/w@24/object_key";
    handler(reqObj as NginxHTTPRequest);

    expect(reqObj.variables?.proxy_rewrite).toEqual(
      `internal/return_attachment:true/plain/${uploadsBucket}/object_key`
    );
    expect(reqObj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("ignores size for `auto` width", () => {
    reqObj.uri = "/w@auto/object_key";
    handler(reqObj as NginxHTTPRequest);

    expect(reqObj.variables?.proxy_rewrite).toEqual(
      `internal/plain/${baseBucket}/object_key`
    );
    expect(reqObj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  imageSizes.forEach((size) => {
    it(`uses \`base\` bucket with \`w@${size}\` size segment`, () => {
      reqObj.uri = `/w@${size}/object_key`;
      handler(reqObj as NginxHTTPRequest);

      expect(reqObj.variables?.proxy_rewrite).toEqual(
        `internal/resize:fit:${size}:0:0:0/extend_ar:false:ce:0:0/plain/${baseBucket}/object_key`
      );
      expect(reqObj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
    });
  });

  imageSizes.forEach((size) => {
    it(`uses \`uploads\` bucket with \`w@${size}\` size segment`, () => {
      reqObj.uri = `/uploads/w@${size}/object_key`;
      handler(reqObj as NginxHTTPRequest);

      expect(reqObj.variables?.proxy_rewrite).toEqual(
        `internal/resize:fit:${size}:0:0:0/extend_ar:false:ce:0:0/plain/${uploadsBucket}/object_key`
      );
      expect(reqObj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
    });
  });

  it("uses remote image", () => {
    reqObj.uri = "/remote/digest/hex";
    handler(reqObj as NginxHTTPRequest);

    expect(reqObj.return).toHaveBeenCalledWith(400, "Invalid signature");
  });
});
