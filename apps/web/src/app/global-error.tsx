"use client";

import React from "react";

import Button from "../../../../packages/ui/src/components/button";
import Spacer from "../../../../packages/ui/src/components/spacer";
import Typography from "../../../../packages/ui/src/components/typography";
import SplashScreen from "../../../../packages/ui/src/layout/splash-screen";

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
