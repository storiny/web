"use client";

import { DEFAULT_WPM, userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../packages/ui/src/components/form-input";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";

import { useAuthState } from "../../../actions";
import { useSignup } from "../../../useSignup";
import { SignupWPMSchema, signupWPMSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<SignupWPMSchema>;
}

const SignupWPMForm = ({ on_submit }: Props): React.ReactElement => {
  const { state, actions } = useAuthState();
  const { isLoading, handleSignup } = useSignup();
  const form = use_form<SignupWPMSchema>({
    resolver: zod_resolver(signupWPMSchema),
    defaultValues: {
      wpm: state.signup.wpm || DEFAULT_WPM
    }
  });

  const handleSubmit: SubmitHandler<SignupWPMSchema> = (values) => {
    actions.setSignupState(values);

    if (on_submit) {
      on_submit(values);
    } else {
      handleSignup();
    }
  };

  return (
    <Form<SignupWPMSchema>
      className={clsx("flex-col", "full-h")}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <FormInput
        data-testid={"wpm-input"}
        label={"Reading speed"}
        max={userProps.wpm.max}
        min={userProps.wpm.min}
        name={"wpm"}
        placeholder={"Your reading speed in words per minute"}
        required
        size={"lg"}
        type={"number"}
      />
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx("flex-col", "flex-center")}>
        <Button
          className={"full-w"}
          loading={isLoading}
          size={"lg"}
          type={"submit"}
        >
          Continue
        </Button>
      </div>
    </Form>
  );
};

export default SignupWPMForm;
