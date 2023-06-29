import { NextMiddleware, NextResponse } from "next/server";

/**
 * Next.js middleware function
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @param request Next request object
 */
export const middleware: NextMiddleware = (request) => {
  if (request.nextUrl.pathname === "/me") {
    return NextResponse.redirect(new URL("/me/profile", request.url));
  }

  if (request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/auth?segment=login", request.url));
  }

  if (request.nextUrl.pathname === "/signup") {
    return NextResponse.redirect(new URL("/auth?segment=signup", request.url));
  }
};

/**
 * Middleware path matching config
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: ["/me", "/login", "/signup"],
};
