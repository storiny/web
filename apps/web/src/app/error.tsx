"use client";

import { captureException as capture_exception } from "@sentry/nextjs";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

const RootErrorBoundary = ({
  reset,
  error
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement => {
  React.useEffect(() => {
    capture_exception(error);
  }, [error]);

  return (
    <SplashScreen force_mount>
      <Typography
        className={clsx(css["t-legible-fg"], css["t-center"])}
        level={"body2"}
      >
        Something went wrong—let&apos;s give it another try.
      </Typography>
      <Spacer orientation={"vertical"} size={2.5} />
      <Button onClick={(): void => reset()}>Retry</Button>
    </SplashScreen>
  );
};

export default RootErrorBoundary;
