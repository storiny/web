"use client";

import { dev_console } from "@storiny/shared/src/utils/dev-log";
import {
  usePathname as use_pathname,
  useSearchParams as use_search_params
} from "next/navigation";
import NProgress from "nprogress";
import React from "react";

NProgress.configure({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  showSpinner: false,
  trickle: false,
  minimum: 0.1,
  easing: "ease",
  speed: 380,
  template: '<div class="bar" role="bar"><div class="peg"></div></div>'
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

const Progress = (): null => {
  const pathname = use_pathname();
  const search_params = use_search_params();

  React.useEffect(() => {
    const is_anchor_of_current_url = (
      current_url: string,
      next_url: string
    ): boolean => {
      const current_url_obj = new URL(current_url);
      const next_url_obj = new URL(next_url);

      // Compare hostname, pathname, and search parameters.
      if (
        current_url_obj.hostname === next_url_obj.hostname &&
        current_url_obj.pathname === next_url_obj.pathname &&
        current_url_obj.search === next_url_obj.search
      ) {
        // Check if the new URL is just an anchor of the current URL.
        const current_hash = current_url_obj.hash;
        const next_hash = next_url_obj.hash;

        return (
          current_hash !== next_hash &&
          current_url_obj.href.replace(current_hash, "") ===
            next_url_obj.href.replace(next_hash, "")
        );
      }

      return false;
    };

    const progress_class = document.querySelectorAll("html");

    const find_closest_anchor = (
      element: HTMLElement | null
    ): HTMLAnchorElement | null => {
      while (element && element.tagName.toLowerCase() !== "a") {
        element = element.parentElement;
      }

      return element as HTMLAnchorElement;
    };

    const handle_click = (event: MouseEvent): void => {
      if (NProgress.isStarted()) {
        return;
      }

      try {
        const target = event.target as HTMLElement;
        const anchor = find_closest_anchor(target);
        const next_url = anchor?.href;

        if (next_url) {
          const current_url = window.location.href;
          // Check if the anchor href is `#`.
          const is_empty_anchor = next_url.charAt(next_url.length - 1) === "#";
          const is_external_link =
            (anchor as HTMLAnchorElement).target === "_blank" ||
            next_url.startsWith("http://") ||
            next_url.startsWith("https://");
          const is_mail = next_url.startsWith("mailto:");
          const is_blob = next_url.startsWith("blob:");
          const is_anchor = is_anchor_of_current_url(current_url, next_url);

          if (is_empty_anchor || is_mail) {
            return;
          }

          if (
            next_url === current_url ||
            is_anchor ||
            is_external_link ||
            is_blob ||
            event.ctrlKey
          ) {
            NProgress.start();
            NProgress.done();

            [].forEach.call(progress_class, (el: Element) => {
              el.classList.remove("nprogress-busy");
            });
          } else {
            NProgress.start();

            ((history): void => {
              const push_state = history.pushState;

              // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
              history.pushState = function () {
                NProgress.done();

                [].forEach.call(progress_class, (el: Element) => {
                  el.classList.remove("nprogress-busy");
                });

                // eslint-disable-next-line prefer-rest-params
                return push_state.apply(history, arguments as any);
              };
            })(window.history);
          }
        }
      } catch (err) {
        dev_console.error(err);

        NProgress.start();
        NProgress.done();
      }
    };

    // Add the global click event listener.
    document.addEventListener("click", handle_click);

    // Clean up the global click event listener when the component is unmounted.
    return () => {
      document.removeEventListener("click", handle_click);
    };
  }, []);

  React.useEffect(() => {
    setTimeout(() => {
      if (NProgress.isStarted()) {
        NProgress.done();
      }
    }, 500);
  }, [pathname, search_params]);

  return null;
};

export default Progress;
