/* eslint-disable prefer-snakecase/prefer-snakecase */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://563fb5e46f4cb639c7f8c839f4046416@o4506393718554624.ingest.sentry.io/4506393724977152",
  integrations: [new Sentry.Replay()],
  tracesSampleRate: 0.8,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
