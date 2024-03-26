import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { NextMiddleware, NextResponse } from "next/server";

import { is_valid_blog_slug } from "~/common/utils/is-valid-blog-slug";

// Third-party frame sources.
const CSP_FRAME_SRC = [
  "twitter.com",
  "platform.twitter.com",
  "syndication.twitter.com"
].join(" ");

// Third-party script sources.
const CSP_SCRIPT_SRC = [
  "cdn.syndication.twimg.com",
  "api.twitter.com",
  "platform.twitter.com"
].join(" ");

// Third-party style sources.
const CSP_STYLE_SRC = ["ton.twimg.com", "platform.twitter.com"].join(" ");

/**
 * Next.js middleware function
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @param request Next request object
 */
export const middleware: NextMiddleware = (request) => {
  switch (request.nextUrl.pathname) {
    case "/login":
      return NextResponse.redirect(new URL("/auth?segment=login", request.url));
    case "/signup":
    case "/sign-up":
      return NextResponse.redirect(
        new URL("/auth?segment=signup", request.url)
      );
    case "/legal":
    case "/terms":
      return NextResponse.redirect(new URL("/legal/terms/tos", request.url));
    case "/privacy":
      return NextResponse.redirect(
        new URL("/legal/policies/privacy", request.url)
      );
    case "/guidelines":
      return NextResponse.redirect(
        new URL("/legal/terms/community-guidelines", request.url)
      );
    case "/cookies":
      return NextResponse.redirect(
        new URL(
          "/legal/policies/privacy#6-cookies-and-tracking-technologies",
          request.url
        )
      );
  }

  // Redirect to blog on the correct domain
  if (request.nextUrl.pathname.startsWith("/blog/")) {
    const slug = request.nextUrl.pathname.split("/")[2];

    if (is_valid_blog_slug(slug)) {
      return NextResponse.redirect(new URL(get_blog_url({ slug })));
    }
  }

  // Add CSP directives.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp_header = `
    default-src 'self' storiny.com *.storiny.com;
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${CSP_SCRIPT_SRC};
    style-src 'self' 'unsafe-inline' ${CSP_STYLE_SRC};
    frame-src 'self' ${process.env.NEXT_PUBLIC_DISCOVERY_URL} ${CSP_FRAME_SRC};
    img-src 'self' blob: data: *;
    media-src 'self' ${process.env.NEXT_PUBLIC_CDN_URL};
    font-src 'self' ${process.env.NEXT_PUBLIC_CDN_URL} fonts.storiny.com;
    connect-src 'self' wss://realms.storiny.com storiny.com *.storiny.com *.sentry.io *.tile.openstreetmap.fr;
    manifest-src 'self' storiny.com *.storiny.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

  // Replace newline characters and spaces
  const csp_header_value = csp_header.replace(/\s{2,}/g, " ").trim();

  const request_headers = new Headers(request.headers);

  if (process.env.NODE_ENV !== "development") {
    request_headers.set("x-nonce", nonce);
    request_headers.set("Content-Security-Policy", csp_header_value);
  }

  let response = NextResponse.next({
    request: {
      headers: request_headers
    }
  });

  // Blog on custom slug

  const hostname =
    request?.headers?.get("x-forwarded-host") || request?.headers?.get("host");
  const native_domains = [
    "storiny.com",
    "www.storiny.com",
    "api.storiny.com",
    "cdn.storiny.com",
    "realms.storiny.com",
    "sitemaps.storiny.com",
    "discovery.storiny.com",
    "status.storiny.com",
    "admin.storiny.com",
    "staff.storiny.com"
  ];

  if (process.env.NODE_ENV === "development") {
    native_domains.push("storiny.local");
  }

  if (
    hostname &&
    !native_domains.includes(hostname) &&
    hostname.includes(".") // Period is present on all valid hosts
  ) {
    const url = request.nextUrl.clone();
    const value = (process.env.NODE_ENV === "development"
      ? /\.storiny\.local$/i
      : /\.storiny\.com$/i
    ).test(hostname)
      ? hostname.replace(
          `.storiny.${
            process.env.NODE_ENV === "development" ? "local" : "com"
          }`,
          ""
        )
      : hostname;

    if (url.pathname === "/robots.txt") {
      return NextResponse.rewrite(new URL(`/api/robots/${value}`, request.url));
    }

    if (url.pathname === "/sitemap.xml") {
      return NextResponse.rewrite(
        new URL(`/api/sitemaps/${value}`, request.url)
      );
    }

    request.nextUrl.pathname = `/blog/${value}${url.pathname}`;

    response = NextResponse.rewrite(request.nextUrl, {
      request: {
        headers: request_headers
      }
    });
  }

  if (process.env.NODE_ENV !== "development") {
    response.headers.set("Content-Security-Policy", csp_header_value);
  }

  return response;
};

/**
 * Middleware path matching config
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
