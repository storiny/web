/* eslint-disable prefer-snakecase/prefer-snakecase */

import { CaptureConsole } from "@sentry/integrations";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://563fb5e46f4cb639c7f8c839f4046416@o4506393718554624.ingest.sentry.io/4506393724977152",
  integrations: [new CaptureConsole({ levels: ["error"] })],
  tracesSampleRate: 0.8
});
