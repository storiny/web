"use client";

import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import styles from "./form-item.module.scss";
import { FormItemProps } from "./form-item.props";
import { FormItemContext } from "./form-item-context";

const FormItem = React.forwardRef<HTMLFieldSetElement, FormItemProps>(
  (props, ref) => {
    const { className, disabled, required, ...rest } = props;
    const id = React.useId();
    return (
      <FormItemContext.Provider
        value={{ id, disabled: Boolean(disabled), required: Boolean(required) }}
      >
        <fieldset
          {...rest}
          className={clsx(css["flex-col"], styles["form-item"], className)}
          data-disabled={String(Boolean(disabled))}
          disabled={disabled}
          ref={ref}
        />
      </FormItemContext.Provider>
    );
  }
);

FormItem.displayName = "FormItem";

export default FormItem;
