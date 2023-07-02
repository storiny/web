"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import FormNewPasswordInput from "~/components/FormNewPasswordInput";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";

import { useAuthState } from "../../../actions";
import { SignupBaseSchema, signupBaseSchema } from "./schema";

interface Props {
  onSubmit?: SubmitHandler<SignupBaseSchema>;
}

const SignupBaseForm = ({ onSubmit }: Props): React.ReactElement => {
  const { state } = useAuthState();
  const form = useForm<SignupBaseSchema>({
    resolver: zodResolver(signupBaseSchema),
    defaultValues: {
      name: state.signup.name,
      email: state.signup.email,
      password: state.signup.password
    }
  });

  const handleSubmit: SubmitHandler<SignupBaseSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Form<SignupBaseSchema>
      className={clsx("flex-col", "full-h")}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <FormInput
        autoComplete={"name"}
        data-testid={"name-input"}
        label={"Full name"}
        maxLength={userProps.name.maxLength}
        minLength={userProps.name.minLength}
        name={"name"}
        required
        size={"lg"}
        type={"text"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <FormInput
        autoComplete={"email"}
        data-testid={"email-input"}
        label={"E-mail address"}
        maxLength={userProps.email.maxLength}
        minLength={userProps.email.minLength}
        name={"email"}
        required
        size={"lg"}
        type={"email"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <FormNewPasswordInput
        data-testid={"password-input"}
        label={"Password"}
        name={"password"}
        placeholder={"6+ characters"}
        required
        size={"lg"}
      />
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx("flex-col", "flex-center")}>
        <Button className={"full-w"} size={"lg"} type={"submit"}>
          Continue
        </Button>
      </div>
    </Form>
  );
};

export default SignupBaseForm;
