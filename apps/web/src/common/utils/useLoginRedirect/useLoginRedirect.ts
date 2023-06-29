"use client";

import { redirect, usePathname } from "next/navigation";

/**
 * Redirects to the login page with `to` parameter
 */
export const useLoginRedirect = (): (() => void) => {
  const pathname = usePathname() || "";
  const to = pathname === "/" ? "" : `?to=${encodeURIComponent(pathname)}`;

  return () => {
    redirect(`/login${to}`);
  };
};
