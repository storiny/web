"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

const DocRateLimit = (): React.ReactElement => (
  <SplashScreen force_mount>
    <Typography
      className={clsx(css["t-legible-fg"], css["t-center"])}
      level={"body2"}
    >
      You have reached the daily limit for creating new stories. We limit the
      number of stories per user each day to prevent the abuse of our platform.
      Please try again tomorrow.
    </Typography>
    <Spacer orientation={"vertical"} size={2.5} />
    <Button as={NextLink} href={"/"}>
      Home
    </Button>
  </SplashScreen>
);

export default DocRateLimit;
