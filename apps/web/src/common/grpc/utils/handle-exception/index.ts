import "server-only";

import { ServiceError } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { isRedirectError as is_redirect_error } from "next/dist/client/components/redirect";
import { notFound as not_found, redirect } from "next/navigation";

/**
 * Returns the 404, login, and gateway error pages for errors from the gRPC service.
 * @param err `ServiceError` object
 */
export const handle_exception = (err: ServiceError): void => {
  // Throw non-service errors.
  if (is_redirect_error(err)) {
    throw err;
  }

  const err_code = err?.code;

  // 404 page
  if (err_code === Status.NOT_FOUND) {
    not_found();
  }

  // Login page
  if (err_code === Status.UNAUTHENTICATED) {
    redirect("/login");
  }

  // Gateway error
  redirect("/gateway-error");
};
