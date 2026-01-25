"use client";

import React from "react";
import { FieldValues, FormProvider } from "react-hook-form";

import { FormProps } from "./form.props";
import { FormContext } from "./form-context";

const Form = <TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues>
): React.ReactElement => {
  const { provider_props, disabled, children, on_submit, ...rest } = props;
  return (
    <FormProvider {...provider_props}>
      <form
        {...rest}
        noValidate
        {...(on_submit && {
          onSubmit: provider_props.handleSubmit(on_submit)
        })}
      >
        <FormContext.Provider value={{ disabled: Boolean(disabled) }}>
          {children}
        </FormContext.Provider>
      </form>
    </FormProvider>
  );
};

Form.displayName = "Form";

export default Form;
