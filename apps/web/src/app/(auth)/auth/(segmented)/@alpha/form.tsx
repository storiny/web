"use client";

import { clsx } from "clsx";
import React from "react";

import { sanitize_authentication_code } from "~/common/utils/sanitize-authentication-code";
import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import { use_invite_code_preflight_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../actions";
import { ALPHA_SCHEMA, AlphaSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<AlphaSchema>;
}

const AlphaForm = ({ on_submit }: Props): React.ReactElement => {
  const { actions } = use_auth_state();
  const toast = use_toast();
  const form = use_form<AlphaSchema>({
    resolver: zod_resolver(ALPHA_SCHEMA),
    defaultValues: {
      alpha_invite_code: ""
    }
  });
  const [mutate_invite_code_preflight, { isLoading: is_loading }] =
    use_invite_code_preflight_mutation();

  const handle_submit: SubmitHandler<AlphaSchema> = React.useCallback(
    (values) => {
      const alpha_invite_code = sanitize_authentication_code(
        values.alpha_invite_code || ""
      );

      if (on_submit) {
        on_submit({ alpha_invite_code });
      } else {
        mutate_invite_code_preflight({
          alpha_invite_code
        })
          .unwrap()
          .then((result) => {
            if (result.is_valid) {
              actions.set_signup_state({
                alpha_invite_code
              });
              actions.switch_segment("signup_base");
            }
          })
          .catch((error) =>
            handle_api_error(
              error,
              toast,
              form,
              "Invalid or expired invite code"
            )
          );
      }
    },
    [actions, form, mutate_invite_code_preflight, on_submit, toast]
  );

  return (
    <Form<AlphaSchema>
      className={clsx(css["flex-col"], css["full-h"])}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <FormInput
        autoComplete={"off"}
        data-testid={"alpha-invite-code-input"}
        label={"Invite code"}
        maxLength={12}
        minLength={8}
        name={"alpha_invite_code"}
        placeholder={"Your alpha invitation code"}
        required
        size={"lg"}
        type={"text"}
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

export default AlphaForm;
