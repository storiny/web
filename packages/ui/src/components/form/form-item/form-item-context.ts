"use client";

import React from "react";

export type FormItemContextValue = {
  disabled: boolean;
  id: string;
  required: boolean;
};

/**
 * Holds `id`, `disabled`, and `required` props for label and helper text
 */
export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);
