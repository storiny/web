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
  on_submit?: SubmitHandler<TFieldValues>;
  /**
   * Props passed to the form provider
   */
  provider_props: Omit<FormProviderProps<TFieldValues>, "children"> & {
    children?: React.ReactNode;
  };
} & Omit<React.ComponentPropsWithoutRef<"form">, "on_submit">;
