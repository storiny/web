"use client";

import { redirect } from "next/navigation";
import React from "react";

import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { select_is_logged_in } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";
import LoginForm from "./form";

const Page = (): React.ReactElement => {
  const { actions } = use_auth_state();
  const logged_in = use_app_selector(select_is_logged_in);

  React.useEffect(() => {
    if (logged_in) {
      redirect("/");
    }
  }, [logged_in]);

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Good to see you again
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        Need an account? {/* TODO: Uncomment after alpha */}
        {/*<Link*/}
        {/*  ClassName={css["t-medium"]}*/}
        {/*  Href={"/auth"}*/}
        {/*  Level={"body2"}*/}
        {/*  OnClick={(): void => actions.switch_segment("signup_base")}*/}
        {/*  Underline={"always"}*/}
        {/*>*/}
        {/*  Sign up*/}
        {/*</Link>*/}
        <Link
          className={css["t-medium"]}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switch_segment("alpha")}
          underline={"always"}
        >
          Join using an invite code
        </Link>
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <LoginForm />
      {/* TODO: Uncomment after alpha  */}
      {/*<Spacer orientation={"vertical"} size={2} />*/}
      {/*<div className={css["flex-center"]}>*/}
      {/*  <Link*/}
      {/*    ClassName={css["t-medium"]}*/}
      {/*    Href={"/auth"}*/}
      {/*    Level={"body2"}*/}
      {/*    OnClick={(): void => actions.switch_segment("base")}*/}
      {/*    Underline={"always"}*/}
      {/*  >*/}
      {/*    Show other options to log in*/}
      {/*  </Link>*/}
      {/*</div>*/}
    </>
  );
};

export default Page;
