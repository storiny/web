"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormCheckbox from "~/components/form-checkbox";
import FormInput from "~/components/form-input";
import FormPasswordInput from "~/components/form-password-input";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import { use_login_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";
import { LOGIN_SCHEMA, LoginSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<LoginSchema>;
}

const LoginForm = ({ on_submit }: Props): React.ReactElement => {
  const router = use_router();
  const { actions } = use_auth_state();
  const toast = use_toast();
  const form = use_form<LoginSchema>({
    resolver: zod_resolver(LOGIN_SCHEMA),
    defaultValues: {
      email: "",
      password: "",
      remember_me: true
    }
  });
  const [mutate_login, { isLoading: is_loading }] = use_login_mutation();

  const handle_submit: SubmitHandler<LoginSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_login(values)
        .unwrap()
        .then((res) => {
          if (res.result === "success") {
            router.replace("/"); // Home page
          } else {
            actions.switch_segment(
              res.result === "suspended"
                ? "suspended"
                : res.result === "held_for_deletion"
                ? "deletion"
                : // TODO: Implement deactivated page (+ add bypass=true to deleted and deactivated pages)
                res.result === "deactivated"
                ? "deactivated"
                : "email_confirmation"
            );
          }
        })
        .catch((e) => toast(e?.data?.error || "Could not log you in", "error"));
    }
  };

  return (
    <Form<LoginSchema>
      className={clsx(css["flex-col"], css["full-h"])}
      disabled={is_loading}
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
              href={"/auth"}
              level={"body3"}
              onClick={(): void => actions.switch_segment("recovery_base")}
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
