"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormCheckbox from "~/components/form-checkbox";
import FormInput from "~/components/form-input";
import FormPasswordInput from "~/components/form-password-input";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import {
  use_login_mutation,
  use_mfa_preflight_mutation
} from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../state";
import { LOGIN_SCHEMA, LoginSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<LoginSchema>;
}

const LoginForm = ({ on_submit }: Props): React.ReactElement => {
  const router = use_app_router();
  const { state, set_state } = use_auth_state();
  const toast = use_toast();
  const form = use_form<LoginSchema>({
    resolver: zod_resolver(LOGIN_SCHEMA),
    defaultValues: {
      email: "",
      password: "",
      remember_me: true
    }
  });
  const [mutate_login, { isLoading: is_login_loading }] = use_login_mutation();
  const [mutate_mfa_preflight, { isLoading: is_mfa_preflight_loading }] =
    use_mfa_preflight_mutation();
  const is_loading = is_login_loading || is_mfa_preflight_loading;
  const [done, set_done] = React.useState<boolean>(false);

  const handle_submit: SubmitHandler<LoginSchema> = React.useCallback(
    (values) => {
      set_state({ login_data: values });

      if (on_submit) {
        on_submit(values);
      } else {
        // Send a preflight request first to determine whether the user has
        // enabled multi-factor authorization.
        mutate_mfa_preflight({
          email: values.email,
          password: values.password
        })
          .unwrap()
          .then((result) => {
            if (result.mfa_enabled) {
              set_state({ segment: "mfa" });
            } else {
              // Continue login if MFA is not enabled for the user.
              mutate_login({ ...values, blog_domain: state.blog_domain })
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
                      router.replace(
                        state.next_url ||
                          (res.is_first_login ? `/?onboarding=true` : "/")
                      ); // Home page
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
            }
          })
          .catch((error) =>
            handle_api_error(error, toast, form, "Could not log you in")
          );
      }
    },
    [
      form,
      mutate_login,
      mutate_mfa_preflight,
      on_submit,
      router,
      set_state,
      state.next_url,
      state.blog_domain,
      toast
    ]
  );

  return (
    <Form<LoginSchema>
      className={clsx(css["flex-col"], css["full-h"])}
      disabled={done || is_loading}
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
      <Spacer orientation={"vertical"} size={3} />
      <FormPasswordInput
        data-testid={"password-input"}
        form_slot_props={{
          label: { className: clsx(css["flex"], css["full-w"]) }
        }}
        label={
          <>
            <span className={css["f-grow"]}>Password</span>
            <Link
              className={css["t-medium"]}
              href={"#"}
              level={"body3"}
              onClick={(event): void => {
                event.preventDefault();
                set_state({ segment: "recovery_base" });
              }}
              underline={"always"}
            >
              Forgot password?
            </Link>
          </>
        }
        name={"password"}
        placeholder={"Your password"}
        required={false} // Asterisk is placed after the Link
        size={"lg"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <FormCheckbox
        data-testid={"remember-me-checkbox"}
        label={"Remember me"}
        name={"remember_me"}
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
          Log in
        </Button>
      </div>
    </Form>
  );
};

export default LoginForm;
