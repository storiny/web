/* eslint-disable prefer-snakecase/prefer-snakecase */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://563fb5e46f4cb639c7f8c839f4046416@o4506393718554624.ingest.sentry.io/4506393724977152",
  integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  allowUrls: [/https?:\/\/(www\.)?storiny\.com/],
  beforeSend: (event) => {
    const error_message = String(event.message);

    if (
      /ResizeObserver/i.test(error_message) ||
      error_message.startsWith("Failed to fetch") ||
      error_message === "NEXT_REDIRECT" ||
      error_message === "NEXT_NOT_FOUND"
    ) {
      return null;
    }

    return event;
  },
  tracesSampleRate: 0.2
});

// This export will instrument router navigations, and is only relevant if you
// enable tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
