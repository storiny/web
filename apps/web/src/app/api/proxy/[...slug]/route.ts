import { captureException as capture_exception } from "@sentry/nextjs";
import { dev_console } from "@storiny/shared/src/utils/dev-log";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { SESSION_COOKIE_ID } from "~/common/constants";

import { get_client_ip } from "./get-ip";

export const dynamic = "force-dynamic";

const handler = async (
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Response> => {
  const host = req.headers.get("host");

  if (host && (host === "storiny.com" || host.includes(".storiny.com"))) {
    return new Response(
      "API proxy can only be used by blogs hosted on external domains.",
      {
        status: 403
      }
    );
  }

  const method = req.method;
  const session_cookie = (await cookies()).get(SESSION_COOKIE_ID);
  const search_params = req.nextUrl.searchParams;
  const pathname = (await params).slug.join("/");
  const url = `${process.env.NEXT_PUBLIC_API_URL}/${pathname}?${search_params.toString()}`;
  const headers = new Headers(req.headers);

  if (session_cookie) {
    headers.set("Cookie", `${SESSION_COOKIE_ID}=${session_cookie.value}`);
  }

  // Set origin header.
  headers.set("Origin", `https://${host}`);

  ["Host", "Referer", "User-Agent"].forEach((header) => {
    const value = req.headers.get(header);
    if (value) headers.set(header, value);
  });

  const client_ip = get_client_ip(req);
  if (client_ip) {
    // `x-web-proxy-ip` is used by Nginx to set the correct IP. The API server
    // should receive the user's IP instead of the web server's IP address.
    headers.set("X-Web-Proxy-IP", client_ip);
  }

  let body: BodyInit | null | undefined = undefined;
  const content_type = req.headers.get("Content-Type");

  try {
    if (method !== "GET" && method !== "HEAD") {
      if (content_type?.includes?.("application/json")) {
        body = JSON.stringify(await req.json());
      } else if (
        content_type?.includes?.("application/x-www-form-urlencoded")
      ) {
        body = await req.text();
      } else if (content_type?.includes?.("multipart/form-data")) {
        body = req.body;
      } else {
        body = await req.text();
      }
    }
  } catch (_err) {
    return new Response("Invalid body", { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body
    });
    const res_headers = new Headers(res.headers);

    // Forward `Set-Cookie` headers.
    const set_cookie =
      res.headers.getSetCookie?.() || res.headers.get("set-cookie");

    if (set_cookie) {
      if (Array.isArray(set_cookie)) {
        set_cookie.forEach((cookie) => {
          res_headers.append("Set-Cookie", cookie);
        });
      } else {
        res_headers.set("Set-Cookie", set_cookie);
      }
    }

    return new Response(res.body, {
      status: res.status,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      statusText: res.statusText,
      headers: res_headers
    });
  } catch (error) {
    dev_console.error(error);
    capture_exception(error);

    return new Response("Proxy error", { status: 502 });
  }
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
