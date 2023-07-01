import { NextMiddleware, NextResponse } from "next/server";

/**
 * Next.js middleware function
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @param request Next request object
 */
export const middleware: NextMiddleware = (request) => {
  switch (request.nextUrl.pathname) {
    case "/me":
      return NextResponse.redirect(new URL("/me/profile", request.url));
    case "/login":
      return NextResponse.redirect(new URL("/auth?segment=login", request.url));
    case "/signup":
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
  }
};

/**
 * Middleware path matching config
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    "/me",
    "/login",
    "/signup",
    "/legal",
    "/terms",
    "/privacy",
    "/guidelines"
  ]
};
