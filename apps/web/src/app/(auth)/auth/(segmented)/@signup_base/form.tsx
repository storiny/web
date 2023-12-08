"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import FormNewPasswordInput from "~/components/form-new-password-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../actions";
import { SIGNUP_BASE_SCHEMA, SignupBaseSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<SignupBaseSchema>;
}

const SignupBaseForm = ({ on_submit }: Props): React.ReactElement => {
  const { state, actions } = use_auth_state();
  const toast = use_toast();
  const form = use_form<SignupBaseSchema>({
    resolver: zod_resolver(SIGNUP_BASE_SCHEMA),
    defaultValues: {
      name: state.signup.name,
      email: state.signup.email,
      password: state.signup.password
    }
  });

  const handle_submit: SubmitHandler<SignupBaseSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      actions.switch_segment("signup_username");
    }
  };

  React.useEffect(() => {
    if (state.signup_errors?.base) {
      handle_api_error(
        state.signup_errors.base,
        toast,
        form,
        "Could not sign you up"
      );
    }
  }, [form, state.signup_errors, toast]);

  return (
    <Form<SignupBaseSchema>
      className={clsx(css["flex-col"], css["full-h"])}
      on_submit={handle_submit}
      provider_props={form}
    >
      <FormInput
        autoComplete={"name"}
        data-testid={"name-input"}
        label={"Full name"}
        maxLength={USER_PROPS.name.max_length}
        minLength={USER_PROPS.name.min_length}
        name={"name"}
        required
        size={"lg"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <FormInput
        autoComplete={"email"}
        data-testid={"email-input"}
        label={"E-mail address"}
        maxLength={USER_PROPS.email.max_length}
        minLength={USER_PROPS.email.min_length}
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
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Button className={css["full-w"]} size={"lg"} type={"submit"}>
          Continue
        </Button>
      </div>
    </Form>
  );
};

export default SignupBaseForm;
