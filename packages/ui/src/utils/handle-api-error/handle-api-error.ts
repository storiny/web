"use client";

import { dev_console } from "@storiny/shared/src/utils/dev-log";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { use_toast } from "~/components/toast";
import { is_form_error } from "~/utils/is-form-error";

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
  dev_console.error(error);

  if (form && is_form_error(error)) {
    handle_form_error<T>(error.data?.errors, form.setError);
  } else {
    toaster(
      error?.data?.error ||
        (error?.status === "FETCH_ERROR"
          ? "Storiny is currently unavailable. Check your network connection or try again later."
          : default_message),
      "error"
    );
  }
};

/**
 * Handles form errors from the server.
 * @param errors The errors from the API server.
 * @param set_error The `setError` method of the form instance.
 */
const handle_form_error = <T extends FieldValues>(
  errors: [string, string][],
  set_error: UseFormReturn<T>["setError"]
): void =>
  errors.forEach(([field, message]) => {
    set_error(field as Path<T>, {
      type: "server",
      message
    });
  });
