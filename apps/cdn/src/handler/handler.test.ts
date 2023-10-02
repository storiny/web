import { ImageSize } from "@storiny/shared";

import { BASE_BUCKET, handler, UPLOADS_BUCKET } from "./handler";

const IMAGE_SIZES = Object.values(ImageSize).filter(
  (value) => typeof value === "number"
);

const r: Partial<Omit<NginxHTTPRequest, "uri">> & { uri: string } = {
  uri: "",
  return: jest.fn(),
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  internalRedirect: jest.fn(),
  variables: {},
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  headersOut: {}
};

describe("handler", () => {
  let req_obj = r;

  beforeEach(() => {
    req_obj = r;
  });

  it("uses base bucket for single segment", () => {
    req_obj.uri = "/object_key";
    handler(req_obj as NginxHTTPRequest);

    expect(req_obj.variables?.proxy_rewrite).toEqual(
      `internal/plain/${BASE_BUCKET}/object_key`
    );
    expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("uses base bucket without resize options for raw assets", () => {
    req_obj.uri = "/w@640/web-assets/raw/object_key"; // Should ignore width
    handler(req_obj as NginxHTTPRequest);

    expect(req_obj.variables?.proxy_rewrite).toEqual(
      `internal/plain/${BASE_BUCKET}/web-assets/raw/object_key`
    );
    expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("uses uploads bucket", () => {
    req_obj.uri = "/uploads/object_key";
    handler(req_obj as NginxHTTPRequest);

    expect(req_obj.variables?.proxy_rewrite).toEqual(
      `internal/plain/${UPLOADS_BUCKET}/object_key`
    );
    expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("uses download option", () => {
    req_obj.uri = "/dl/object_key";
    handler(req_obj as NginxHTTPRequest);

    expect(req_obj.variables?.proxy_rewrite).toEqual(
      `internal/return_attachment:true/plain/${UPLOADS_BUCKET}/object_key`
    );
    expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("ignores size for download option", () => {
    req_obj.uri = "/dl/w@24/object_key";
    handler(req_obj as NginxHTTPRequest);

    expect(req_obj.variables?.proxy_rewrite).toEqual(
      `internal/return_attachment:true/plain/${UPLOADS_BUCKET}/object_key`
    );
    expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  it("ignores size for `auto` width", () => {
    req_obj.uri = "/w@auto/object_key";
    handler(req_obj as NginxHTTPRequest);

    expect(req_obj.variables?.proxy_rewrite).toEqual(
      `internal/plain/${BASE_BUCKET}/object_key`
    );
    expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
  });

  IMAGE_SIZES.forEach((size) => {
    it(`uses \`base\` bucket with \`w@${size}\` size segment`, () => {
      req_obj.uri = `/w@${size}/object_key`;
      handler(req_obj as NginxHTTPRequest);

      expect(req_obj.variables?.proxy_rewrite).toEqual(
        `internal/resize:fit:${size}:0:0:0/extend_ar:false:ce:0:0/plain/${BASE_BUCKET}/object_key`
      );
      expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
    });
  });

  IMAGE_SIZES.forEach((size) => {
    it(`uses \`uploads\` bucket with \`w@${size}\` size segment`, () => {
      req_obj.uri = `/uploads/w@${size}/object_key`;
      handler(req_obj as NginxHTTPRequest);

      expect(req_obj.variables?.proxy_rewrite).toEqual(
        `internal/resize:fit:${size}:0:0:0/extend_ar:false:ce:0:0/plain/${UPLOADS_BUCKET}/object_key`
      );
      expect(req_obj.internalRedirect).toHaveBeenCalledWith("@proxy_pass");
    });
  });

  it("uses remote image", () => {
    req_obj.uri = "/remote/digest/hex";
    handler(req_obj as NginxHTTPRequest);

    expect(req_obj.return).toHaveBeenCalledWith(400, "Invalid signature");
  });
});
