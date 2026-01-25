import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://563fb5e46f4cb639c7f8c839f4046416@o4506393718554624.ingest.sentry.io/4506393724977152",
  tracesSampleRate: 0.8,
  beforeSend: (event) => {
    // Ignore "GRPC not found" errors (status code: 5)
    if (/5 not_found/i.test(String(event.message))) {
      return null;
    }

    // Next.js notFound() errors
    if (event.exception?.values?.[0].value === "NEXT_HTTP_ERROR_FALLBACK;404") {
      return null;
    }

    // GRPC invalid argument errors (raised due to invalid item identifiers
    // from users)
    if (
      String(event.exception?.values?.[0].value).startsWith(
        "3 INVALID_ARGUMENT"
      )
    ) {
      return null;
    }

    return event;
  },
  ignoreErrors: [/5 not_found/i]
});
