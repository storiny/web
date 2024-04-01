"use client";

import { captureException as capture_exception } from "@sentry/nextjs";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Link from "~/components/link";
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
  const is_gateway_error = error?.message === "gateway_error";

  React.useEffect(() => {
    if (!is_gateway_error) {
      capture_exception(error);
    }
  }, [is_gateway_error, error]);

  return (
    <SplashScreen force_mount>
      <Typography
        className={clsx(css["t-legible-fg"], css["t-center"])}
        level={"body2"}
        style={{ maxWidth: "320px" }}
      >
        {is_gateway_error ? (
          <>
            Storiny is currently unavailable. Please try again later or check
            our{" "}
            {
              <Link
                href={process.env.NEXT_PUBLIC_STATUS_PAGE_URL || "/"}
                target={"_blank"}
                underline={"always"}
              >
                service status
              </Link>
            }{" "}
            for any updates.
            <br />
            <br />
            Error code: 504 (Gateway timeout)
          </>
        ) : (
          <>Something went wrong—let&apos;s give it another try.</>
        )}
      </Typography>
      <Spacer orientation={"vertical"} size={2.5} />
      <Button onClick={(): void => reset()}>Retry</Button>
    </SplashScreen>
  );
};

export default RootErrorBoundary;
