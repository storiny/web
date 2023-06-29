"use client";

import React from "react";

import Button from "~/components/Button";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import SplashScreen from "~/layout/SplashScreen";

const GlobalError = ({
  reset,
  error,
}: {
  error: Error;
  reset: () => void;
}): React.ReactElement => (
  <html>
    <body>
      <SplashScreen forceMount>
        <Typography className={"t-legible-fg"} level={"body2"}>
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
