"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../packages/ui/src/components/form";
import FormCheckbox from "../../../../../../../../packages/ui/src/components/form-checkbox";
import FormInput from "../../../../../../../../packages/ui/src/components/form-input";
import FormPasswordInput from "../../../../../../../../packages/ui/src/components/form-password-input";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Link from "../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../packages/ui/src/components/toast";
import { use_login_mutation } from "~/redux/features";

import { use_auth_state } from "../../../actions";
import { LoginSchema, LOGIN_SCHEMA } from "./schema";

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
      remember_me: false
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
                : "email_confirmation"
            );
          }
        })
        .catch((e) => toast(e?.data?.error || "Could not log you in", "error"));
    }
  };

  return (
    <Form<LoginSchema>
      className={clsx("flex-col", "full-h")}
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
          label: { className: clsx("flex", "full-w") }
        }}
        label={
          <>
            <span className={"f-grow"}>Password</span>
            <Link
              className={"t-medium"}
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
      <div className={clsx("flex-col", "flex-center")}>
        <Button
          className={"full-w"}
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
