"use client";

import React from "react";

import { SubmitHandler } from "~/components/form";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Stepper from "~/components/stepper";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";
import SignupBaseForm from "./form";
import { SignupBaseSchema } from "./schema";

const Page = (): React.ReactElement => {
  const { actions } = use_auth_state();

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
      <Typography className={css["t-minor"]} level={"body2"}>
        Already have an account?{" "}
        <Link
          className={css["t-medium"]}
          href={"#"}
          onClick={(event): void => {
            event.preventDefault();
            actions.switch_segment("login");
          }}
          underline={"always"}
        >
          Log in
        </Link>
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <SignupBaseForm on_submit={on_submit} />
      <Spacer orientation={"vertical"} size={5} />
      <div className={css["flex-center"]}>
        <Link
          className={css["t-medium"]}
          href={"#"}
          level={"body2"}
          onClick={(event): void => {
            event.preventDefault();
            actions.switch_segment("base");
          }}
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
