"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../packages/ui/src/components/form";
import FormCheckbox from "../../../../../../../../packages/ui/src/components/form-checkbox";
import FormInput from "../../../../../../../../packages/ui/src/components/form-input";
import FormNewPasswordInput from "../../../../../../../../packages/ui/src/components/form-new-password-input";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../packages/ui/src/components/toast";
import { use_reset_password_mutation } from "~/redux/features";

import { useAuthState } from "../../../actions";
import { ResetSchema, resetSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<ResetSchema>;
  token: string;
}

const ResetForm = ({ on_submit, token }: Props): React.ReactElement => {
  const toast = use_toast();
  const { actions } = useAuthState();
  const form = use_form<ResetSchema>({
    resolver: zod_resolver(resetSchema),
    defaultValues: {
      email: "",
      password: "",
      "logout-of-all-devices": false
    }
  });
  const [mutateResetPassword, { isLoading }] = use_reset_password_mutation();

  const handleSubmit: SubmitHandler<ResetSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutateResetPassword({ ...values, token })
        .unwrap()
        .then(() => actions.switchSegment("reset_success"))
        .catch((e) =>
          toast(e?.data?.error || "Could not reset your password", "error")
        );
    }
  };

  return (
    <Form<ResetSchema>
      className={clsx("flex-col", "full-h")}
      on_submit={handleSubmit}
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
        name={"logout-of-all-devices"}
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

export default ResetForm;
