"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../packages/ui/src/components/form-input";
import FormNewPasswordInput from "../../../../../../../../packages/ui/src/components/form-new-password-input";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";

import { useAuthState } from "../../../actions";
import { SignupBaseSchema, signupBaseSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<SignupBaseSchema>;
}

const SignupBaseForm = ({ on_submit }: Props): React.ReactElement => {
  const { state } = useAuthState();
  const form = use_form<SignupBaseSchema>({
    resolver: zod_resolver(signupBaseSchema),
    defaultValues: {
      name: state.signup.name,
      email: state.signup.email,
      password: state.signup.password
    }
  });

  const handleSubmit: SubmitHandler<SignupBaseSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    }
  };

  return (
    <Form<SignupBaseSchema>
      className={clsx("flex-col", "full-h")}
      on_submit={handleSubmit}
      provider_props={form}
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
