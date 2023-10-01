"use client";

import { redirect } from "next/navigation";
import React from "react";

import { SubmitHandler } from "~/components/form";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Stepper from "~/components/stepper";
import Typography from "~/components/typography";
import { select_is_logged_in } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import { use_auth_state } from "../../../actions";
import SignupBaseForm from "./form";
import { SignupBaseSchema } from "./schema";

const Page = (): React.ReactElement => {
  const { actions } = use_auth_state();
  const logged_in = use_app_selector(select_is_logged_in);

  React.useEffect(() => {
    if (logged_in) {
      redirect("/");
    }
  }, [logged_in]);

  const on_submit: SubmitHandler<SignupBaseSchema> = React.useCallback(
    ({ name, password, email }) => {
      actions.set_signup_state({ name, password, email });
      actions.switch_segment("signup_username");
    },
    [actions]
  );

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Sign up to Storiny
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        Already have an account?{" "}
        <Link
          className={"t-medium"}
          href={"/auth"}
          onClick={(): void => actions.switch_segment("login")}
          underline={"always"}
        >
          Log in
        </Link>
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <SignupBaseForm on_submit={on_submit} />
      <Spacer orientation={"vertical"} size={5} />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switch_segment("base")}
          underline={"always"}
        >
          Show other options to sign up
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <Stepper active_steps={1} total_steps={3} />
    </>
  );
};

export default Page;
