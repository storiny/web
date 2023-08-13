"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import { useRecoveryMutation } from "~/redux/features";

import { useAuthState } from "../../../actions";
import { RecoverySchema, recoverySchema } from "./schema";

interface Props {
  onSubmit?: SubmitHandler<RecoverySchema>;
}

const RecoveryForm = ({ onSubmit }: Props): React.ReactElement => {
  const toast = useToast();
  const { state, actions } = useAuthState();
  const form = useForm<RecoverySchema>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: state.recovery.email
    }
  });
  const [recover, { isLoading }] = useRecoveryMutation();

  const handleSubmit: SubmitHandler<RecoverySchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      actions.setRecoveryState(values);
      recover(values)
        .unwrap()
        .then(() => actions.switchSegment("recovery_inbox"))
        .catch((e) =>
          toast(e?.data?.error || "Could not recover your account", "error")
        );
    }
  };

  return (
    <Form<RecoverySchema>
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
        placeholder={"Your e-mail address"}
        required
        size={"lg"}
        type={"email"}
      />
      <Spacer orientation={"vertical"} size={5} />
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
      <Grow />
    </Form>
  );
};

export default RecoveryForm;
