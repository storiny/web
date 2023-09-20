import React from "react";
import { GroupBase } from "react-select";
import { AsyncCreatableProps } from "react-select/async-creatable";

export type MultiSelectSize = "lg" | "md";
export type MultiSelectColor = "inverted" | "ruby";
export type MultiSelectOption = { label: string; value: string };

// Polymorphic component support is limited by the library (`react-select`)
type MultiSelectPrimitive = AsyncCreatableProps<
  unknown,
  true,
  GroupBase<unknown>
> &
  Omit<React.ComponentPropsWithRef<"div">, "onChange">;

export interface MultiSelectProps
  extends Omit<
    MultiSelectPrimitive,
    "isDisabled" | "isLoading" | "options" | "value" | "onChange"
  > {
  /**
   * The size of the component.
   * @default 'inverted'
   */
  color?: MultiSelectColor;
  /**
   * The disabled state.
   * @default false
   */
  disabled?: boolean;
  /**
   * The loading state.
   * @default false
   */
  loading?: boolean;
  /**
   * The maximum number of selected options.
   */
  max?: number;
  /**
   * Value change callback
   * @param newValues New values
   */
  onChange?: (newValues: string[]) => void;
  /**
   * Options for the component.
   */
  options: MultiSelectOption[];
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: MultiSelectSize;
  /**
   * Value of the compoent.
   */
  value?: string[];
}
