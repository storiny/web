"use client";

import { redirect } from "next/navigation";
import React from "react";

import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { select_is_logged_in } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import { useAuthState } from "../../../actions";
import LoginForm from "./form";

const Page = (): React.ReactElement => {
  const { actions } = useAuthState();
  const loggedIn = use_app_selector(select_is_logged_in);

  React.useEffect(() => {
    if (loggedIn) {
      redirect("/");
    }
  }, [loggedIn]);

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Good to see you again
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        Need an account?{" "}
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switchSegment("signup_base")}
          underline={"always"}
        >
          Sign up
        </Link>
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <LoginForm />
      <Spacer orientation={"vertical"} size={2} />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switchSegment("base")}
          underline={"always"}
        >
          Show other options to log in
        </Link>
      </div>
    </>
  );
};

export default Page;
