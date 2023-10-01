"use client";

import { DEFAULT_WPM, USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";

import { use_auth_state } from "../../../actions";
import { use_signup } from "../../../use-signup";
import { SIGNUP_WPM_SCHEMA, SignupWPMSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<SignupWPMSchema>;
}

const SignupWPMForm = ({ on_submit }: Props): React.ReactElement => {
  const { state, actions } = use_auth_state();
  const { is_loading, handle_signup } = use_signup();
  const form = use_form<SignupWPMSchema>({
    resolver: zod_resolver(SIGNUP_WPM_SCHEMA),
    defaultValues: {
      wpm: state.signup.wpm || DEFAULT_WPM
    }
  });

  const handle_submit: SubmitHandler<SignupWPMSchema> = (values) => {
    actions.set_signup_state(values);

    if (on_submit) {
      on_submit(values);
    } else {
      handle_signup();
    }
  };

  return (
    <Form<SignupWPMSchema>
      className={clsx("flex-col", "full-h")}
      on_submit={handle_submit}
      provider_props={form}
    >
      <FormInput
        data-testid={"wpm-input"}
        label={"Reading speed"}
        max={USER_PROPS.wpm.max}
        min={USER_PROPS.wpm.min}
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
          loading={is_loading}
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
