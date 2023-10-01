"use client";

import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import SplashScreen from "~/layout/splash-screen";

const RootErrorBoundary = ({
  reset
}: {
  reset: () => void;
}): React.ReactElement => (
  <SplashScreen force_mount>
    <Typography className={"t-legible-fg"} level={"body2"}>
      Something went wrong—let&apos;s give it another try.
    </Typography>
    <Spacer orientation={"vertical"} size={2.5} />
    <Button onClick={(): void => reset()}>Retry</Button>
  </SplashScreen>
);

export default RootErrorBoundary;
