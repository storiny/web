import "server-only";

import { ServiceError } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { notFound, redirect } from "next/navigation";

/**
 * Returns not found page, login and gateway error pages for errors from the gRPC service.
 * @param err `ServiceError` object
 */
export const handleException = (err: ServiceError): void => {
  const errCode = err?.code;

  // 404 page
  if (errCode === Status.NOT_FOUND) {
    notFound();
    return;
  }

  // Login page
  if (errCode === Status.UNAUTHENTICATED) {
    redirect("/login");
    return;
  }

  // Gateway error
  redirect("/gateway-error");
  return;
};
