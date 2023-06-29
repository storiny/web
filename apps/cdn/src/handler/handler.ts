import { NATIVE_REGEX, REMOTE_REGEX } from "../constants/regex";
import { RequestType } from "../types";
import { decodeHex } from "../utils/decodeHex";
import { getWidth } from "../utils/getWidth";
import { verify } from "../utils/verify";

export const baseBucket = "s3://base";
export const uploadsBucket = "s3://uploads";

type Request = NginxHTTPRequest;

/**
 * Prepares to dispatch a text response
 * @param r The HTTP request object
 */
const prepareTextResponse = (r: Request): string =>
  (r.headersOut["Content-Type"] = "text/plain; charset=utf-8");

/**
 * Redirects to internal proxy
 * @param r The HTTP request object
 * @param path The path passed to the upstream server
 */
const passToProxy = (r: Request, path: string): void => {
  r.variables.proxy_rewrite = path;
  r.internalRedirect("@proxy_pass");
};

/**
 * Builds optimization fragments from width
 * @param parsedWidth Width in pixels
 */
const getResizeOption = (parsedWidth: string): string => {
  const width = getWidth(parsedWidth);
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
    if (uri.startsWith("/remote") && REMOTE_REGEX.test(uri)) {
      const [, parsedWidth, digest, hex] = REMOTE_REGEX.exec(uri) || [];
      const decodedUrl = decodeHex(hex);
      const resizeOption = getResizeOption(parsedWidth);

      if (decodedUrl && verify(digest, decodedUrl)) {
        return passToProxy(
          r,
          `internal${resizeOption || "/"}plain/${decodedUrl}`
        );
      }

      prepareTextResponse(r);
      r.return(400, "Invalid signature");
      return;
    }

    // Native S3 bucket
    const [, type, parsedWidth, key] = NATIVE_REGEX.exec(uri) || [];

    if (!key) {
      prepareTextResponse(r);
      r.return(400, "Invalid or missing media key");
      return;
    }

    const reqType = type as RequestType;
    const resizeOption = getResizeOption(parsedWidth);

    if (["uploads", "dl"].includes(reqType)) {
      // Uploads bucket
      return passToProxy(
        r,
        `internal${
          type === "dl" ? "/return_attachment:true/" : resizeOption || "/"
        }plain/${uploadsBucket}/${key}`
      );
    }

    // Use base bucket
    return passToProxy(
      r,
      `internal${resizeOption || "/"}plain/${baseBucket}/${key}`
    );
  } catch (e) {
    prepareTextResponse(r);
    r.return(500, "Internal server error");
  }
};
