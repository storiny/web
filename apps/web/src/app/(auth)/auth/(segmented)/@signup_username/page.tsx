"use client";

import React from "react";

import { SubmitHandler } from "~/components/form";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Stepper from "~/components/stepper";
import Typography from "~/components/typography";

import { use_auth_state } from "../../../actions";
import SignupUsernameForm from "./form";
import { SignupUsernameSchema } from "./schema";

const Page = (): React.ReactElement => {
  const { actions, state } = use_auth_state();

  const on_submit: SubmitHandler<SignupUsernameSchema> = React.useCallback(
    ({ username }) => {
      actions.set_signup_state({ username });
      actions.switch_segment(
        state.signup.wpm === null ? "signup_wpm_base" : "email_confirmation"
      );
    },
    [actions, state.signup.wpm]
  );

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Create a username
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        Your username identifies you uniquely across Storiny, and can only
        contain alphanumeric characters and underscores. You can change this
        later.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <SignupUsernameForm on_submit={on_submit} />
      <Spacer orientation={"vertical"} size={5} />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switch_segment("signup_base")}
          underline={"always"}
        >
          Return to the previous screen
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <Stepper active_steps={2} total_steps={3} />
    </>
  );
};

export default Page;
