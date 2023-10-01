"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import { use_auth_state } from "../../../actions";

const Page = (): React.ReactElement => {
  const { actions } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Invalid token
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        This token is invalid. Kindly check the link again or{" "}
        <Link
          href={"/auth"}
          onClick={(): void => actions.switch_segment("recovery_base")}
          underline={"always"}
        >
          submit a new request to reset your password
        </Link>
        .
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx("flex-col", "flex-center")}>
        <Button as={NextLink} className={"full-w"} href={"/"} size={"lg"}>
          Home
        </Button>
      </div>
    </>
  );
};

export default Page;
