"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import { useAuthState } from "../../../actions";

const Page = (): React.ReactElement => {
  const { actions } = useAuthState();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Token expired
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        This token has expired. Kindly{" "}
        <Link
          href={"/auth"}
          onClick={(): void => actions.switchSegment("recovery_base")}
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
