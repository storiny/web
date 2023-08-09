"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormCheckbox from "~/components/FormCheckbox";
import FormInput from "~/components/FormInput";
import FormPasswordInput from "~/components/FormPasswordInput";
import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import { useLoginMutation } from "~/redux/features";

import { useAuthState } from "../../../actions";
import { LoginSchema, loginSchema } from "./schema";

interface Props {
  onSubmit?: SubmitHandler<LoginSchema>;
}

const LoginForm = ({ onSubmit }: Props): React.ReactElement => {
  const router = useRouter();
  const { actions } = useAuthState();
  const toast = useToast();
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      "remember-me": false
    }
  });
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit: SubmitHandler<LoginSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      login(values)
        .unwrap()
        .then((res) => {
          if (res.result === "success") {
            router.replace("/"); // Home page
          } else {
            actions.switchSegment(
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
      disabled={isLoading}
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
      <Spacer orientation={"vertical"} size={3} />
      <FormPasswordInput
        data-testid={"password-input"}
        formSlotProps={{
          label: { className: clsx("flex", "full-w") }
        }}
        label={
          <>
            <span className={"f-grow"}>Password</span>
            <Link
              className={"t-medium"}
              href={"/auth"}
              level={"body3"}
              onClick={(): void => actions.switchSegment("recovery_base")}
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
        name={"remember-me"}
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
          Log in
        </Button>
      </div>
    </Form>
  );
};

export default LoginForm;
