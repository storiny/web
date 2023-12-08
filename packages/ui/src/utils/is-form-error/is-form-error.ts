"use client";

export type FormError = {
  data: {
    errors: [string, string][];
    type: "form";
  };
};

/**
 * Predicate function for determining form error response from the server.
 * @param error The error from the API server.
 */
export const is_form_error = (error: any): error is FormError =>
  error?.data?.type === "form";
