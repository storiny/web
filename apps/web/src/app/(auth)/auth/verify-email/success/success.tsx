"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

const Page = (): React.ReactElement => (
  <>
    <Typography as={"h1"} level={"h3"}>
      E-mail verified
    </Typography>
    <Spacer orientation={"vertical"} size={0.5} />
    <Typography className={"t-minor"} level={"body2"}>
      Your e-mail has been successfully verified, and your account is now
      active.
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
