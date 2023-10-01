"use client";

import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";

const GlobalError = ({
  reset,
  error
}: {
  error: Error;
  reset: () => void;
}): React.ReactElement => (
  <html>
    <body>
      <SplashScreen force_mount>
        <Typography className={css["t-legible-fg"]} level={"body2"}>
          Something went wrong—let&apos;s give it another try.{" "}
          {JSON.stringify(error)}
        </Typography>
        <Spacer orientation={"vertical"} size={2.5} />
        <Button onClick={(): void => reset()}>Retry</Button>
      </SplashScreen>
    </body>
  </html>
);

export default GlobalError;
