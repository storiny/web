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
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../packages/ui/src/components/toast";
import { use_recovery_mutation } from "~/redux/features";

import { useAuthState } from "../../../actions";
import { RecoverySchema, recoverySchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<RecoverySchema>;
}

const RecoveryForm = ({ on_submit }: Props): React.ReactElement => {
  const toast = use_toast();
  const { state, actions } = useAuthState();
  const form = use_form<RecoverySchema>({
    resolver: zod_resolver(recoverySchema),
    defaultValues: {
      email: state.recovery.email
    }
  });
  const [mutateRecover, { isLoading }] = use_recovery_mutation();

  const handleSubmit: SubmitHandler<RecoverySchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      actions.setRecoveryState(values);
      mutateRecover(values)
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
      on_submit={handleSubmit}
      provider_props={form}
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
