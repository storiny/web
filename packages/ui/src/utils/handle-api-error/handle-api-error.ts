"use client";

import { Form, UseFormReturn } from "react-hook-form";

import { use_toast } from "~/components/toast";

/**
 * Handles errors received from a request to the API server. If the received
 * errors are form errors, the relevant fields are updated with the error state
 * in the form. If the received error is a toast error, a toast is rendered
 * with the error message. If there is no error payload, the default message is
 * used to render a toast error.
 *
 * Toast errors from the server are received in the following format:
 *
 * ```json
 * {
 *     "type": "toast",
 *     "error": "the error message"
 * }
 * ```
 *
 * Form errors from the server are received in the following format:
 *
 * ```json
 * {
 *     "type": "form",
 *     "errors": [field_name, error_message][]
 * }
 * ```
 *
 * @param error
 * @param toaster
 * @param form
 */
export const handle_api_error = (
  error: any,
  toaster: ReturnType<typeof use_toast>,
  form: UseFormReturn
): void => {
  const error_type = error?.data?.type;
  if (error_type === "form") {
    handle_form_error(error.errors, form.setError);
  } else if (error_type === "toast") {
    toaster(error.data.message, "error");
  }
};

const handle_form_error = (
  errors: [string, string][],
  set_error: UseFormReturn["setError"]
): void =>
  errors.forEach(([field, message]) => {
    set_error(field, {
      type: "server",
      message
    });
  });
