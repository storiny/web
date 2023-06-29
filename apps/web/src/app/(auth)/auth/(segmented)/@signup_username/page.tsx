"use client";

import React from "react";

import { SubmitHandler } from "~/components/Form";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Stepper from "~/components/Stepper";
import Typography from "~/components/Typography";

import { useAuthState } from "../../../actions";
import SignupUsernameForm from "./form";
import { SignupUsernameSchema } from "./schema";

const Page = (): React.ReactElement => {
  const { actions, state } = useAuthState();

  const onSubmit: SubmitHandler<SignupUsernameSchema> = React.useCallback(
    ({ username }) => {
      actions.setSignupState({ username });
      actions.switchSegment(
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
      <SignupUsernameForm onSubmit={onSubmit} />
      <Spacer orientation={"vertical"} size={5} />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switchSegment("signup_base")}
          underline={"always"}
        >
          Return to the previous screen
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <Stepper activeSteps={2} totalSteps={3} />
    </>
  );
};

export default Page;
