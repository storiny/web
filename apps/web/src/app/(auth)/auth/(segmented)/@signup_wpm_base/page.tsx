"use client";

import { DEFAULT_WPM } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Stepper from "~/components/Stepper";
import Typography from "~/components/Typography";

import { useAuthState } from "../../../actions";

const Page = (): React.ReactElement => {
  const { actions } = useAuthState();

  const onSkip = (): void => {
    actions.setSignupState({ wpm: DEFAULT_WPM });
    actions.switchSegment("email_confirmation");
  };

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Just one more step...
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        As not all readers read at the same pace, the reading time for stories
        on Storiny depends on their reading speed. We can provide readers with
        more accurate and personalized reading times this way. You can always do
        this later.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <div className={clsx("flex-col")}>
        <Button onClick={onSkip} size={"lg"} variant={"hollow"}>
          Skip
        </Button>
        <Spacer orientation={"vertical"} size={1.75} />
        <Button
          onClick={(): void => actions.switchSegment("signup_wpm_confirmation")}
          size={"lg"}
        >
          Take the Test
        </Button>
      </div>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switchSegment("signup_username")}
          underline={"always"}
        >
          Return to the previous screen
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <Stepper activeSteps={3} totalSteps={3} />
    </>
  );
};

export default Page;
