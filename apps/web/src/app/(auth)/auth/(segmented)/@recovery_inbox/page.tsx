"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";

const Page = (): React.ReactElement => {
  const { actions, state } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Check your inbox
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        If an account is associated with{" "}
        <span className={css["t-medium"]} style={{ wordBreak: "break-all" }}>
          {state.recovery.email}
        </span>
        , you will receive an email containing instructions on how to reset your
        password.
        <br />
        <br />
        Did not receive an e-mail from us? Try checking the spam folder or{" "}
        <Link
          href={"#"}
          onClick={(event): void => {
            event.preventDefault();
            actions.switch_segment("recovery_base");
          }}
          underline={"always"}
        >
          request a new e-mail to reset password
        </Link>
        .
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Link
          className={css["t-medium"]}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switch_segment("login")}
          underline={"always"}
        >
          Log in instead
        </Link>
        <Spacer orientation={"vertical"} size={3} />
        <Button
          as={NextLink}
          className={css["full-w"]}
          href={"/"}
          size={"lg"}
          variant={"hollow"}
        >
          Home
        </Button>
      </div>
    </>
  );
};

export default Page;
