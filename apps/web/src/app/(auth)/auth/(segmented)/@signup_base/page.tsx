"use client";

import { redirect } from "next/navigation";
import React from "react";

import { SubmitHandler } from "~/components/Form";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Stepper from "~/components/Stepper";
import Typography from "~/components/Typography";
import { select_is_logged_in } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import { useAuthState } from "../../../actions";
import SignupBaseForm from "./form";
import { SignupBaseSchema } from "./schema";

const Page = (): React.ReactElement => {
  const { actions } = useAuthState();
  const loggedIn = use_app_selector(select_is_logged_in);

  React.useEffect(() => {
    if (loggedIn) {
      redirect("/");
    }
  }, [loggedIn]);

  const onSubmit: SubmitHandler<SignupBaseSchema> = React.useCallback(
    ({ name, password, email }) => {
      actions.setSignupState({ name, password, email });
      actions.switchSegment("signup_username");
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
          onClick={(): void => actions.switchSegment("login")}
          underline={"always"}
        >
          Log in
        </Link>
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <SignupBaseForm onSubmit={onSubmit} />
      <Spacer orientation={"vertical"} size={5} />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switchSegment("base")}
          underline={"always"}
        >
          Show other options to sign up
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <Stepper activeSteps={1} totalSteps={3} />
    </>
  );
};

export default Page;
