"use client";

import { clsx } from "clsx";
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
        Password successfully reset
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        We have successfully reset your password, you can now log in to Storiny.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx("flex-col", "flex-center")}>
        <Link
          className={"t-medium"}
          href={"/"}
          level={"body2"}
          underline={"always"}
        >
          Home
        </Link>
        <Spacer orientation={"vertical"} size={3} />
        <Button
          className={"full-w"}
          onClick={(): void => actions.switchSegment("login")}
          size={"lg"}
        >
          Log in
        </Button>
      </div>
    </>
  );
};

export default Page;
