"use client";

import React from "react";

import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../state";
import LoginForm from "./form";

const Page = (): React.ReactElement => {
  const { set_state } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Verify it&apos;s you
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography color={"minor"} level={"body2"}>
        Enter your authentication code to continue. You can also use one of the
        backup codes for your Storiny account.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <LoginForm />
      <Spacer orientation={"vertical"} size={2} />
      <div className={css["flex-center"]}>
        <Link
          className={css["t-medium"]}
          href={"#"}
          level={"body2"}
          onClick={(event): void => {
            event.preventDefault();
            set_state({ segment: "base" });
          }}
          underline={"always"}
        >
          Show other options to log in
        </Link>
      </div>
    </>
  );
};

export default Page;
