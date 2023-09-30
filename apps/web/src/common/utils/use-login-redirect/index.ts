"use client";

import { redirect, usePathname as use_pathname } from "next/navigation";

/**
 * Redirects to the login page with `to` parameter
 */
export const use_login_redirect = (): (() => void) => {
  const pathname = use_pathname() || "";
  const to = pathname === "/" ? "" : `?to=${encodeURIComponent(pathname)}`;

  return () => {
    redirect(`/login${to}`);
  };
};
