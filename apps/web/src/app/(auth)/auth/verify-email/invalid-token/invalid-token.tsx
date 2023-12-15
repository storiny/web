"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

const Page = (): React.ReactElement => (
  <>
    <Typography as={"h1"} level={"h3"}>
      Invalid token
    </Typography>
    <Spacer orientation={"vertical"} size={0.5} />
    <Typography className={css["t-minor"]} level={"body2"}>
      This token is invalid. Kindly check the link again.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <Grow />
    <div className={clsx(css["flex-col"], css["flex-center"])}>
      <Button
        as={NextLink}
        className={css["full-w"]}
        // TODO: Enable after alpha
        disabled
        href={"/"}
        size={"lg"}
      >
        Home
      </Button>
    </div>
  </>
);

export default Page;
