import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export type QueryErrorType =
  // Server error (server / 50x)
  | "server"
  // Network errors (client)
  | "network";

/**
 * Resolves the type of error returned from the query hook
 * @param error The query error object
 */
export const getQueryErrorType = (
  error?: FetchBaseQueryError | SerializedError
): QueryErrorType =>
  error && "status" in error && error?.status !== "FETCH_ERROR"
    ? "server"
    : "network";
