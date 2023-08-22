"use client";

import clsx from "clsx";
import React from "react";
import {
  GroupBase,
  LoadingIndicatorProps,
  MultiValueRemoveProps
} from "react-select";
import CreatableSelect from "react-select/creatable";

import XIcon from "~/icons/X";

import Spinner from "../Spinner";
import styles from "./MultiSelect.module.scss";
import { MultiSelectProps } from "./MultiSelect.props";

// Remove button

const MultiValueRemove = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>({
  children,
  innerProps
}: MultiValueRemoveProps<Option, IsMulti, Group>): React.ReactElement => (
  <div
    {...innerProps}
    className={clsx(
      "flex-center",
      styles["remove-container"],
      innerProps?.className
    )}
    role="button"
    {...({ css: undefined } as any)}
  >
    {children || <XIcon />}
  </div>
);

// Loading indicator

const LoadingIndicator = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(
  props: LoadingIndicatorProps<Option, IsMulti, Group>
): React.ReactElement => {
  const { innerProps } = props;
  return (
    <Spinner
      {...({ ...innerProps, size: undefined, color: undefined } as any)}
      size={"sm"}
      style={{ margin: "0 4px 0 12px" }}
    />
  );
};

const MultiSelect = React.forwardRef<
  React.ElementRef<typeof CreatableSelect>,
  MultiSelectProps
>((props, ref) => {
  const {
    size = "md",
    color = "inverted",
    value: valueProp = [],
    placeholder = "Select an option...",
    options,
    max,
    disabled,
    loading,
    className,
    style,
    styles: selectStyles,
    ...rest
  } = props;
  const [value, setValue] = React.useState<typeof valueProp>(valueProp || []);
  const isOptionDisabled =
    typeof max === "number" && (value as any).length >= max;

  return (
    <CreatableSelect<typeof options>
      {...(rest as any)}
      className={clsx(
        styles.container,
        styles[size],
        styles[color],
        disabled && styles.disabled,
        className
      )}
      classNames={{
        container: (props): boolean => props.isFocused && styles.focused,
        input: (): string => styles.input,
        control: (): string => styles.control,
        placeholder: (): string => styles.placeholder,
        multiValue: (): string => styles.value,
        valueContainer: (): string => styles["value-container"],
        multiValueLabel: (): string => clsx("t-body-2", styles["value-label"]),
        option: (optionProps): string =>
          clsx(
            optionProps.isFocused && styles.focused,
            optionProps.isDisabled && styles.disabled,
            styles.option
          ),
        menu: (): string => styles.menu,
        noOptionsMessage: (): string => clsx("t-body-2", "t-minor"),
        loadingMessage: (): string => clsx("t-body-2", "t-minor")
      }}
      components={{
        MultiValueRemove,
        LoadingIndicator
      }}
      data-limited={isOptionDisabled}
      formatCreateLabel={(inputValue): string =>
        isOptionDisabled
          ? "Delete the already selected options to create new ones."
          : `Create "${inputValue}"`
      }
      isDisabled={disabled}
      isLoading={loading}
      isMulti
      isOptionDisabled={(): boolean => isOptionDisabled}
      noOptionsMessage={(): string =>
        isOptionDisabled
          ? "You've reached the maximum limit"
          : "No options available"
      }
      onChange={(newValue, actionMeta): void => {
        setValue(newValue);
        rest?.onChange?.(newValue!, actionMeta);
      }}
      options={isOptionDisabled ? [] : options}
      placeholder={placeholder}
      ref={ref}
      styles={{
        ...selectStyles,
        container: (base): React.CSSProperties =>
          ({ ...base, ...style } as React.CSSProperties),
        dropdownIndicator: (): React.CSSProperties => ({
          display: "none"
        }),
        clearIndicator: (): React.CSSProperties => ({
          display: "none"
        })
      }}
      unstyled
      value={value}
    />
  );
});

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
