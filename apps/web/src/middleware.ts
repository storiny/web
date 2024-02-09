import { NextMiddleware, NextResponse } from "next/server";

// Third-party frame sources.
const CSP_FRAME_SRC = [
  "https://www.instagram.com",
  "https://twitter.com",
  "platform.twitter.com",
  "syndication.twitter.com"
].join(" ");

// Third-party script sources.
const CSP_SCRIPT_SRC = [
  "https://platform.instagram.com",
  "https://www.instagram.com",
  "https://cdn.syndication.twimg.com",
  "api.twitter.com",
  "platform.twitter.com"
].join(" ");

// Third-party style sources.
const CSP_STYLE_SRC = ["https://ton.twimg.com", "platform.twitter.com"].join(
  " "
);

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

  // Skip adding CSP directives in development environment.
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp_header = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${CSP_SCRIPT_SRC};
    style-src 'self' 'unsafe-inline' ${CSP_STYLE_SRC};
    frame-src 'self' ${process.env.NEXT_PUBLIC_DISCOVERY_URL} ${CSP_FRAME_SRC};
    img-src 'self' blob: data: *;
    media-src 'self' ${process.env.NEXT_PUBLIC_CDN_URL};
    font-src 'self';
    connect-src 'self' wss://realms.storiny.com *.storiny.com *.sentry.io *.tile.openstreetmap.fr;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

  // Replace newline characters and spaces
  const csp_header_value = csp_header.replace(/\s{2,}/g, " ").trim();

  const request_headers = new Headers(request.headers);
  request_headers.set("x-nonce", nonce);
  request_headers.set("Content-Security-Policy", csp_header_value);

  const response = NextResponse.next({
    request: {
      headers: request_headers
    }
  });

  response.headers.set("Content-Security-Policy", csp_header_value);

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
