"use client";

import { DEFAULT_WPM, userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";

import { useAuthState } from "../../../actions";
import { useSignup } from "../../../useSignup";
import { SignupWPMSchema, signupWPMSchema } from "./schema";

interface Props {
  onSubmit?: SubmitHandler<SignupWPMSchema>;
}

const SignupWPMForm = ({ onSubmit }: Props): React.ReactElement => {
  const { state, actions } = useAuthState();
  const { isLoading, handleSignup } = useSignup();
  const form = useForm<SignupWPMSchema>({
    resolver: zodResolver(signupWPMSchema),
    defaultValues: {
      wpm: state.signup.wpm || DEFAULT_WPM
    }
  });

  const handleSubmit: SubmitHandler<SignupWPMSchema> = ({ wpm }) => {
    actions.setSignupState({ wpm });

    if (onSubmit) {
      onSubmit({ wpm });
    } else {
      handleSignup();
    }
  };

  return (
    <Form<SignupWPMSchema>
      className={clsx("flex-col", "full-h")}
      onSubmit={handleSubmit}
      providerProps={form}
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
