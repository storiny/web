import { z } from "zod";

const IP_SCHEMA = z.string().ip();

/**
 * Validates an IP address.
 * @param value The IP address value.
 */
const is_ip = (value: unknown): boolean => IP_SCHEMA.safeParse(value).success;

/**
 * Parses the `x-forwarded-for` header.
 * @see https://github.com/pbojinov/request-ip/blob/master/src/index.js
 * @param value The value to be parsed.
 */
const get_ip_from_x_forwarded_for = (value: unknown): string | null => {
  if (!value || typeof value !== "string") {
    return null;
  }

  // x-forwarded-for may return multiple IP addresses in the format: "client
  // IP, proxy 1 IP, proxy 2 IP". Therefore, the right-most IP address is the IP
  // address of the most recent proxy and the left-most IP address is the IP
  // address of the originating client. Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
  const forwarded_ips = value
    .split(",")
    .map((val) => val.trim())
    .map((ip) => {
      if (ip.includes(":")) {
        const split = ip.split(":"); // Handle port
        // Only use this if it's IPv4 (ip:port)
        if (split.length === 2) {
          return split[0];
        }
      }

      return ip;
    });

  // Sometimes IP addresses in this header can be 'unknown' (http://stackoverflow.com/a/11285650).
  // Therefore taking the right-most IP address that is not unknown.
  for (let i = 0; i < forwarded_ips.length; i++) {
    if (is_ip(forwarded_ips[i])) {
      return forwarded_ips[i];
    }
  }

  return null;
};

/**
 * Determines client IP address.
 * @param req Incoming request
 */
export const get_client_ip = (req: Request): string | null => {
  if (is_ip(req.headers.get("x-client-ip"))) {
    return req.headers.get("x-client-ip");
  }

  // Proxies.
  const x_forwarded_for = get_ip_from_x_forwarded_for(
    req.headers.get("x-forwarded-for")
  );
  if (is_ip(x_forwarded_for)) {
    return x_forwarded_for;
  }

  // Cloudflare.
  // @see https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
  // `CF-Connecting-IP` - applied to every request to the origin.
  if (is_ip(req.headers.get("cf-connecting-ip"))) {
    return req.headers.get("cf-connecting-ip");
  }

  // Cloudflare: `True-Client-IP`.
  if (is_ip(req.headers.get("true-client-ip"))) {
    return req.headers.get("true-client-ip");
  }

  // Default nginx proxy.
  if (is_ip(req.headers.get("x-real-ip"))) {
    return req.headers.get("x-real-ip");
  }

  if (is_ip(req.headers.get("x-forwarded"))) {
    return req.headers.get("x-forwarded");
  }

  if (is_ip(req.headers.get("forwarded-for"))) {
    return req.headers.get("forwarded-for");
  }

  return null;
};
