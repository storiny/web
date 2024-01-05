"use client";

import {
  usePathname as use_pathname,
  useRouter as use_router
} from "next/navigation";
import NProgress from "nprogress";

type RouterReturn = ReturnType<typeof use_router>;
type NavigateOptions = Parameters<RouterReturn["push"]>[1];

/**
 * Predicate function for determining whether the two provided URLs have the same protocol, host, and pathname.
 * @param target The target URL
 * @param current The source URL
 */
export const is_same_url = (target: URL, current: URL): boolean =>
  `${target.protocol}//${target.host}${target.pathname}` ===
  `${current.protocol}//${current.host}${current.pathname}`;

/**
 * Extended version of Next.js useRouter hook that triggers the NProgress
 * instance when a new path is pushed.
 */
export const use_app_router: typeof use_router = () => {
  const pathname = use_pathname();
  const router = use_router() || {};
  const { push } = router;

  router.push = async (
    href: string,
    options?: NavigateOptions & { skip_progress: boolean }
  ): Promise<void> => {
    const { skip_progress, ...rest } = options || {};
    const current_url = new URL(pathname, location.href);
    const target_url = new URL(href, location.href);

    if (
      href.startsWith("https://") ||
      href.startsWith("http://") ||
      is_same_url(target_url, current_url) ||
      href === pathname ||
      skip_progress
    ) {
      return push(href, rest);
    }

    NProgress.start();

    return push(href, rest);
  };

  return router;
};
