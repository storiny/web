"use client";

import { useRouter as use_router } from "next/navigation";
import NProgress from "nprogress";

/**
 * Extended version of Next.js useRouter hook that triggers the NProgress
 * instance when a new path is pushed.
 */
export const use_app_router: typeof use_router = () => {
  const router = use_router() || {};
  const { push } = router;

  router.push = async (...args: Parameters<typeof push>): Promise<void> => {
    NProgress.start();
    return push(...args);
  };

  return router;
};
