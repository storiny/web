import React from "react";
import { FieldValues, FormProviderProps, SubmitHandler } from "react-hook-form";

export type FormProps<TFieldValues extends FieldValues = FieldValues> = {
  /**
   * If `true`, all the form controls elements are disabled
   */
  disabled?: boolean;
  /**
   * Submit handler function
   */
  onSubmit?: SubmitHandler<TFieldValues>;
  /**
   * Props passed to the form provider
   */
  providerProps: Omit<FormProviderProps<TFieldValues>, "children"> & {
    children?: React.ReactNode;
  };
} & Omit<React.ComponentPropsWithoutRef<"form">, "onSubmit">;
