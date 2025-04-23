import * as Sentry from "@sentry/nextjs";

export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
};

// eslint-disable-next-line prefer-snakecase/prefer-snakecase
export const onRequestError = Sentry.captureRequestError;
