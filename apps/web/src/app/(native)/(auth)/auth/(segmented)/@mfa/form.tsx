"use client";

import { clsx } from "clsx";
import React from "react";

import { get_url_or_path, use_app_router } from "~/common/utils";
import { sanitize_authentication_code } from "~/common/utils/sanitize-authentication-code";
import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import { use_login_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../state";
import {
  AUTHENTICATION_CODE_MAX_LENGTH,
  AUTHENTICATION_CODE_MIN_LENGTH,
  MFA_SCHEMA,
  MFASchema
} from "./schema";

interface Props {
  on_submit?: SubmitHandler<MFASchema>;
}

const MFAForm = ({ on_submit }: Props): React.ReactElement => {
  const router = use_app_router();
  const { state, set_state } = use_auth_state();
  const toast = use_toast();
  const form = use_form<MFASchema>({
    resolver: zod_resolver(MFA_SCHEMA),
    defaultValues: {
      code: ""
    }
  });
  const [mutate_login, { isLoading: is_loading }] = use_login_mutation();
  const [done, set_done] = React.useState<boolean>(false);

  const handle_submit: SubmitHandler<MFASchema> = React.useCallback(
    (values) => {
      set_state({ mfa_code: values.code });

      const login_data = state.login_data;

      if (on_submit) {
        on_submit(values);
      } else if (login_data) {
        mutate_login({
          email: login_data.email,
          password: login_data.password,
          remember_me: login_data.remember_me,
          code: sanitize_authentication_code(values.code),
          blog_domain: state.blog_domain
        })
          .unwrap()
          .then((res) => {
            if (res.result === "success") {
              set_done(true);

              if (state.blog_domain && res.blog_token) {
                const params = new URLSearchParams();

                params.set("token", res.blog_token);

                if (state.next_url) {
                  params.set("next-url", state.next_url);
                }

                router.replace(
                  `https://${state.blog_domain}/verify-login?${params.toString()}`
                );
              } else {
                router.replace(get_url_or_path(state.next_url) || "/"); // Home page
              }

              router.refresh(); // Refresh the state
            } else {
              const next_segment =
                res.result === "suspended"
                  ? "suspended"
                  : res.result === "held_for_deletion"
                    ? "deletion"
                    : res.result === "deactivated"
                      ? "deactivated"
                      : "email_confirmation";

              set_state({ segment: next_segment });
            }
          })
          .catch((error) => {
            set_done(false);
            handle_api_error(error, toast, form, "Could not log you in");
          });
      } else {
        toast("Missing credentials", "error");
      }
    },
    [
      form,
      mutate_login,
      on_submit,
      router,
      set_state,
      state.login_data,
      state.next_url,
      state.blog_domain,
      toast
    ]
  );

  return (
    <Form<MFASchema>
      className={clsx(css["flex-col"], css["full-h"])}
      disabled={done || is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <FormInput
        autoComplete={"off"}
        autoFocus
        data-testid={"mfa-code-input"}
        label={"Authentication code"}
        maxLength={AUTHENTICATION_CODE_MAX_LENGTH}
        minLength={AUTHENTICATION_CODE_MIN_LENGTH}
        name={"code"}
        placeholder={"6-digit authentication code"}
        required
        size={"lg"}
        type={"text"}
      />
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Button
          className={css["full-w"]}
          disabled={done}
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

export default MFAForm;
