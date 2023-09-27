"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormCheckbox from "~/components/FormCheckbox";
import FormInput from "~/components/FormInput";
import FormNewPasswordInput from "~/components/FormNewPasswordInput";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import { use_reset_password_mutation } from "~/redux/features";

import { useAuthState } from "../../../actions";
import { ResetSchema, resetSchema } from "./schema";

interface Props {
  onSubmit?: SubmitHandler<ResetSchema>;
  token: string;
}

const ResetForm = ({ onSubmit, token }: Props): React.ReactElement => {
  const toast = useToast();
  const { actions } = useAuthState();
  const form = useForm<ResetSchema>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
      password: "",
      "logout-of-all-devices": false
    }
  });
  const [mutateResetPassword, { isLoading }] = use_reset_password_mutation();

  const handleSubmit: SubmitHandler<ResetSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
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
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <FormInput
        autoComplete={"email"}
        data-testid={"email-input"}
        label={"E-mail address"}
        maxLength={userProps.email.maxLength}
        minLength={userProps.email.minLength}
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
