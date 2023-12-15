import "server-only";

import { ServiceError } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import { isNotFoundError as is_not_found_error } from "next/dist/client/components/not-found";
import { isRedirectError as is_redirect_error } from "next/dist/client/components/redirect";
import { notFound as not_found, redirect } from "next/navigation";

/**
 * Returns the 404, login, and gateway error pages for errors from the gRPC service.
 * @param err `ServiceError` object
 */
export const handle_exception = (err: ServiceError): void => {
  // Throw non-service errors.
  if (is_redirect_error(err) || is_not_found_error(err)) {
    throw err;
  }

  capture_exception(err);

  const err_code = err?.code;

  // 404 page
  if (err_code === Status.NOT_FOUND) {
    not_found();
  }

  // Login page
  if (err_code === Status.UNAUTHENTICATED) {
    // This case indicates that the auth token is missing from the environment.
    if (err.message === "missing_client_auth_token") {
      redirect("/gateway-error");
    }

    redirect("/login");
  }

  // Gateway error
  redirect("/gateway-error");
};
