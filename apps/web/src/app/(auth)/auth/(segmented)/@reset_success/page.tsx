"use client";

import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";

const Page = (): React.ReactElement => {
  const { actions } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Password successfully reset
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        We have successfully reset your password, you can now log in to Storiny.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Link
          className={css["t-medium"]}
          href={"/"}
          level={"body2"}
          underline={"always"}
        >
          Home
        </Link>
        <Spacer orientation={"vertical"} size={3} />
        <Button
          className={css["full-w"]}
          onClick={(): void => actions.switch_segment("login")}
          size={"lg"}
        >
          Log in
        </Button>
      </div>
    </>
  );
};

export default Page;
