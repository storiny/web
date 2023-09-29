"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../packages/ui/src/components/typography";

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
