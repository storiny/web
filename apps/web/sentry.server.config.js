/* eslint-disable prefer-snakecase/prefer-snakecase */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://563fb5e46f4cb639c7f8c839f4046416@o4506393718554624.ingest.sentry.io/4506393724977152",
  tracesSampleRate: 0.8,
  beforeSend: (event) => {
    // Ignore "GRPC not found" errors (status code: 5)
    if ((event.message || "").startsWith("5 NOT_FOUND")) {
      return null;
    }

    return event;
  }
});
