"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

const Page = (): React.ReactElement => (
  <>
    <Typography as={"h1"} level={"h3"}>
      Invalid token
    </Typography>
    <Spacer orientation={"vertical"} size={0.5} />
    <Typography className={"t-minor"} level={"body2"}>
      This token is invalid. Kindly check the link again.
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

export default Page;
