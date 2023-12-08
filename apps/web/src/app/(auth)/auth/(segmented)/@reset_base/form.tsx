"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormCheckbox from "~/components/form-checkbox";
import FormInput from "~/components/form-input";
import FormNewPasswordInput from "~/components/form-new-password-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import { use_reset_password_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../actions";
import { RESET_SCHEMA, ResetSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<ResetSchema>;
  token: string;
}

const ResetForm = ({ on_submit, token }: Props): React.ReactElement => {
  const toast = use_toast();
  const { actions } = use_auth_state();
  const form = use_form<ResetSchema>({
    resolver: zod_resolver(RESET_SCHEMA),
    defaultValues: {
      email: "",
      password: "",
      logout_of_all_devices: false
    }
  });
  const [mutate_reset_password, { isLoading: is_loading }] =
    use_reset_password_mutation();

  const handle_submit: SubmitHandler<ResetSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_reset_password({ ...values, token })
        .unwrap()
        .then(() => actions.switch_segment("reset_success"))
        .catch((error) =>
          handle_api_error(error, toast, form, "Could not reset your password")
        );
    }
  };

  return (
    <Form<ResetSchema>
      className={clsx(css["flex-col"], css["full-h"])}
      on_submit={handle_submit}
      provider_props={form}
    >
      <FormInput
        autoComplete={"email"}
        data-testid={"email-input"}
        label={"E-mail address"}
        maxLength={USER_PROPS.email.max_length}
        minLength={USER_PROPS.email.min_length}
        name={"email"}
        placeholder={"Your current e-mail address"}
        required
        size={"lg"}
        type={"email"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <FormNewPasswordInput
        data-testid={"password-input"}
        label={"New password"}
        name={"password"}
        placeholder={"6+ characters"}
        required
        size={"lg"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <FormCheckbox
        data-testid={"logout-checkbox"}
        label={"Log out of all devices"}
        name={"logout_of_all_devices"}
      />
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Button
          className={css["full-w"]}
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

export default ResetForm;
