import { NextMiddleware, NextResponse } from "next/server";

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
};

/**
 * Middleware path matching config
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    "/login",
    "/signup",
    "/sign-up",
    "/legal",
    "/terms",
    "/privacy",
    "/guidelines",
    "/cookies"
  ]
};
