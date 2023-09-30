import { NATIVE_REGEX, REMOTE_REGEX } from "../constants/regex";
import { RequestType } from "../types";
import { decode_hex } from "../utils/decode-hex";
import { get_width } from "../utils/get-width";
import { verify } from "../utils/verify";

export const BASE_BUCKET = "s3://base";
export const UPLOADS_BUCKET = "s3://uploads";

type Request = NginxHTTPRequest;

/**
 * Prepares to dispatch a text response
 * @param r The HTTP request object
 */
const prepare_text_response = (r: Request): string =>
  (r.headersOut["Content-Type"] = "text/plain; charset=utf-8");

/**
 * Redirects to internal proxy
 * @param r The HTTP request object
 * @param path The path passed to the upstream server
 */
const pass_to_proxy = (r: Request, path: string): void => {
  r.variables.proxy_rewrite = path;
  r.internalRedirect("@proxy_pass");
};

/**
 * Builds optimization fragments from width
 * @param parsed_width Width in pixels
 */
const get_resize_option = (parsed_width: string): string => {
  const width = get_width(parsed_width);
  return Boolean(width) && width !== "auto"
    ? `/resize:fit:${width}:0:0:0/extend_ar:false:ce:0:0/`
    : "";
};

/**
 * Request handler
 * @param r The HTTP request object
 */
export const handler = (r: Request): void | undefined => {
  try {
    const uri = r.uri || "";

    // Remote image URI with digest and hex
    if (uri.startsWith("/remote")) {
      const matches = REMOTE_REGEX.exec(uri);

      if (matches !== null) {
        const [, parsed_width, digest, hex] = matches;
        const decoded_url = decode_hex(hex);
        const resize_option = get_resize_option(parsed_width);

        if (decoded_url && verify(digest, decoded_url)) {
          return pass_to_proxy(
            r,
            `internal${resize_option || "/"}plain/${decoded_url}`
          );
        }

        prepare_text_response(r);
        r.return(400, "Invalid signature");
        return;
      }
    }

    // Native S3 bucket
    const [, type, parsed_width, key] = NATIVE_REGEX.exec(uri) || [];

    if (!key) {
      prepare_text_response(r);
      r.return(400, "Invalid or missing media key");
      return;
    }

    const req_type = type as RequestType;
    const resize_option = get_resize_option(parsed_width);

    if (["uploads", "dl"].includes(req_type)) {
      // Uploads bucket
      return pass_to_proxy(
        r,
        `internal${
          type === "dl" ? "/return_attachment:true/" : resize_option || "/"
        }plain/${UPLOADS_BUCKET}/${key}`
      );
    }

    // Use base bucket
    return pass_to_proxy(
      r,
      `internal${resize_option || "/"}plain/${BASE_BUCKET}/${key}`
    );
  } catch {
    prepare_text_response(r);
    r.return(500, "Internal server error");
  }
};
