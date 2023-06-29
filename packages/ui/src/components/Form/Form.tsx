"use client";

import React from "react";
import { FieldValues, FormProvider } from "react-hook-form";

import { FormProps } from "./Form.props";
import { FormContext } from "./FormContext";

const Form = <TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues>
): React.ReactElement => {
  const { providerProps, disabled, children, onSubmit, ...rest } = props;

  return (
    <FormProvider {...providerProps}>
      <form
        {...rest}
        noValidate
        {...(onSubmit && { onSubmit: providerProps.handleSubmit(onSubmit) })}
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
