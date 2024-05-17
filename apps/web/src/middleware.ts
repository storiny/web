import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { NextMiddleware, NextResponse } from "next/server";

import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";

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

const NATIVE_DOMAINS = [
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

/**
 * Next.js middleware function
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @param request Next request object
 */
export const middleware: NextMiddleware = (request) => {
  const pathname = `${
    request.nextUrl.pathname
  }?${request.nextUrl.searchParams.toString()}`;
  const common_init: RequestInit = {
    headers: {
      "x-pathname": pathname
    }
  };

  switch (request.nextUrl.pathname) {
    case "/login":
    case "/signup":
    case "/sign-up":
      // eslint-disable-next-line no-case-declarations
      const search_params = request.nextUrl.searchParams;
      search_params.set(
        "segment",
        request.nextUrl.pathname === "/login" ? "login" : "signup"
      );

      return NextResponse.redirect(
        new URL(`/auth?${search_params.toString()}`, request.url),
        common_init
      );
    case "/legal":
    case "/terms":
      return NextResponse.redirect(
        new URL("/legal/terms/tos", request.url),
        common_init
      );
    case "/privacy":
      return NextResponse.redirect(
        new URL("/legal/policies/privacy", request.url),
        common_init
      );
    case "/guidelines":
      return NextResponse.redirect(
        new URL("/legal/terms/community-guidelines", request.url),
        common_init
      );
    case "/cookies":
      return NextResponse.redirect(
        new URL(
          "/legal/policies/privacy#6-cookies-and-tracking-technologies",
          request.url
        ),
        common_init
      );
  }

  // Redirect to blog on the correct domain
  if (request.nextUrl.pathname.startsWith("/blog/")) {
    const identifier = request.nextUrl.pathname.split("/")[2];

    if (
      process.env.NODE_ENV !== "development" &&
      is_valid_blog_identifier(identifier)
    ) {
      return NextResponse.redirect(
        new URL(
          get_blog_url({
            [identifier.includes(".") ? "domain" : "slug"]: identifier
          })
        ),
        common_init
      );
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

  request_headers.set("x-pathname", pathname);

  if (process.env.NODE_ENV !== "development") {
    request_headers.set("x-nonce", nonce);
    request_headers.set("Content-Security-Policy", csp_header_value);
  }

  let response = NextResponse.next({
    request: {
      headers: request_headers
    }
  });

  // Blog on custom domain

  const hostname =
    request?.headers?.get("x-forwarded-host") || request?.headers?.get("host");

  if (process.env.NODE_ENV === "development") {
    NATIVE_DOMAINS.push("storiny.local");
  }

  if (
    hostname &&
    !NATIVE_DOMAINS.includes(hostname) &&
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

    if (
      [
        "/robots.txt",
        "/sitemap.xml",
        "/favicon.ico",
        "/app.webmanifest"
      ].includes(url.pathname)
    ) {
      return NextResponse.rewrite(
        new URL(`/api/blogs/${value}${url.pathname}`, request.url),
        common_init
      );
    }

    request.nextUrl.pathname = `/blog/${value}${url.pathname}`;

    response = NextResponse.rewrite(request.nextUrl, {
      headers: {
        "x-pathname": pathname
      },
      request: {
        headers: request_headers
      }
    });
  } else if (/\.ico/.test(request.nextUrl.pathname || "")) {
    // Ignore favicon requests.
    return response;
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
     */
    {
      source: "/((?!api|_next/static|_next/image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
