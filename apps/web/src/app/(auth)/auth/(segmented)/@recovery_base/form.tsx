"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import { use_recovery_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../actions";
import { RECOVERY_SCHEMA, RecoverySchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<RecoverySchema>;
}

const RecoveryForm = ({ on_submit }: Props): React.ReactElement => {
  const toast = use_toast();
  const { state, actions } = use_auth_state();
  const form = use_form<RecoverySchema>({
    resolver: zod_resolver(RECOVERY_SCHEMA),
    defaultValues: {
      email: state.recovery.email
    }
  });
  const [mutate_recover, { isLoading: is_loading }] = use_recovery_mutation();

  const handle_submit: SubmitHandler<RecoverySchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      actions.set_recovery_state(values);
      mutate_recover(values)
        .unwrap()
        .then(() => actions.switch_segment("recovery_inbox"))
        .catch((error) =>
          handle_api_error(error, toast, form, "Could not recover your account")
        );
    }
  };

  return (
    <Form<RecoverySchema>
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
        placeholder={"Your e-mail address"}
        required
        size={"lg"}
        type={"email"}
      />
      <Spacer orientation={"vertical"} size={5} />
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
      <Grow />
    </Form>
  );
};

export default RecoveryForm;
