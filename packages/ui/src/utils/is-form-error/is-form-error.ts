"use client";

import { FieldValues, Path, UseFormReturn } from "react-hook-form";

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
 * @param error The error from the API server.
 * @param toaster The toast instance.
 * @param form The form instance.
 * @param default_message The default error message for the toast.
 */
export const handle_api_error = <T extends FieldValues>(
  error: any,
  toaster: ReturnType<typeof use_toast>,
  form: UseFormReturn<T> | null,
  default_message: string
): void => {
  const error_type = error?.data?.type;

  if (form && error_type === "form") {
    handle_form_error<T>(error.errors, form.setError);
  } else {
    toaster(error?.data?.message || default_message, "error");
  }
};

/**
 * Handles form errors from the server.
 * @param errors The errors from the API server.
 * @param set_error The `setError` method of the form instance.
 */
const handle_form_error = <T extends FieldValues>(
  errors: [Path<T>, string][],
  set_error: UseFormReturn<T>["setError"]
): void =>
  errors.forEach(([field, message]) => {
    set_error(field, {
      type: "server",
      message
    });
  });
