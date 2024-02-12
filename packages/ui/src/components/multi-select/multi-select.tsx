"use client";

import clsx from "clsx";
import React from "react";
import {
  GroupBase,
  LoadingIndicatorProps,
  MultiValueRemoveProps
} from "react-select";
import CreatableSelect from "react-select/async-creatable";

import XIcon from "~/icons/x";
import css from "~/theme/main.module.scss";

import Spinner from "../spinner";
import styles from "./multi-select.module.scss";
import { MultiSelectOption, MultiSelectProps } from "./multi-select.props";

// Remove button

const MultiValueRemove = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>({
  children,
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  innerProps
}: MultiValueRemoveProps<Option, IsMulti, Group>): React.ReactElement => (
  <div
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    {...innerProps}
    className={clsx(
      css["flex-center"],
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
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  const { innerProps } = props;
  return (
    <Spinner
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
    value: value_prop = [],
    placeholder = "Select an option...",
    auto_size,
    options,
    max,
    disabled,
    loading,
    className,
    style,
    styles: select_styles,
    menuPlacement: menu_placement,
    noOptionsMessage: no_options_message,
    loadOptions: load_options,
    ...rest
  } = props;
  const [value, set_value] = React.useState<MultiSelectOption[]>(
    options.length
      ? options.filter((option) => value_prop.includes(option.value))
      : value_prop.length
        ? value_prop.map((item) => ({ value: item, label: item }))
        : []
  );
  const is_option_disabled = typeof max === "number" && value.length >= max;

  return (
    <CreatableSelect<MultiSelectOption[]>
      {...(rest as any)}
      cacheOptions={false} // Options are cached in Redux
      className={clsx(
        styles.container,
        styles[size],
        styles[color],
        auto_size && styles["auto-size"],
        disabled && styles.disabled,
        className
      )}
      classNames={{
        container: (props): string => clsx(props.isFocused && styles.focused),
        input: (): string => styles.input,
        control: (): string => styles.control,
        placeholder: (): string => styles.placeholder,
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        multiValue: (): string => styles.value,
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        valueContainer: (): string => styles["value-container"],
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        multiValueLabel: (): string =>
          clsx(css["t-body-2"], styles["value-label"]),
        option: (option_props): string =>
          clsx(
            option_props.isFocused && styles.focused,
            option_props.isDisabled && styles.disabled,
            styles.option
          ),
        menu: (): string =>
          clsx(styles.menu, menu_placement === "top" && styles["is-top"]),
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        noOptionsMessage: (): string => clsx(css["t-body-2"], css["t-minor"]),
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        loadingMessage: (): string => clsx(css["t-body-2"], css["t-minor"])
      }}
      components={{
        MultiValueRemove,
        LoadingIndicator
      }}
      data-limited={is_option_disabled}
      defaultOptions={is_option_disabled ? [] : options}
      formatCreateLabel={(input_value): string =>
        is_option_disabled
          ? "Delete the already selected options to create new ones."
          : `Create "${input_value}"`
      }
      isDisabled={disabled}
      isLoading={loading}
      isMulti
      is_option_disabled={(): boolean => is_option_disabled}
      loadOptions={is_option_disabled ? undefined : load_options}
      menuPlacement={menu_placement}
      noOptionsMessage={
        no_options_message ||
        ((): string =>
          is_option_disabled
            ? "You've reached the maximum limit"
            : "No options available")
      }
      onChange={(next_value): void => {
        if (next_value) {
          set_value(next_value);
          rest?.onChange?.(next_value.map(({ value }) => value));
        }
      }}
      placeholder={placeholder}
      ref={ref}
      styles={{
        ...select_styles,
        container: (base): React.CSSProperties =>
          ({ ...base, ...style }) as React.CSSProperties,
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        dropdownIndicator: (): React.CSSProperties => ({
          display: "none"
        }),
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
