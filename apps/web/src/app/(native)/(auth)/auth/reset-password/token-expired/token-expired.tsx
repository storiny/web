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

import { use_auth_state } from "../../../state";

const Page = (): React.ReactElement => {
  const { set_state } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Token expired
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography color={"minor"} level={"body2"}>
        This token has expired. Kindly{" "}
        <Link
          href={"#"}
          onClick={(event): void => {
            event.preventDefault();
            set_state({ segment: "recovery_base" });
          }}
          underline={"always"}
        >
          submit a new request to reset your password
        </Link>
        .
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Button as={NextLink} className={css["full-w"]} href={"/"} size={"lg"}>
          Home
        </Button>
      </div>
    </>
  );
};

export default Page;
