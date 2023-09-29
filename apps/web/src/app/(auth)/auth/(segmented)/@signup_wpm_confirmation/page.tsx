"use client";

import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Link from "../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Stepper from "../../../../../../../../packages/ui/src/components/stepper";
import Typography from "../../../../../../../../packages/ui/src/components/typography";

import { useAuthState } from "../../../actions";

const Page = (): React.ReactElement => {
  const { actions } = useAuthState();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Let&apos;s determine your reading speed
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        After pressing the &quot;Start&quot; button, you will be presented with
        a piece of writing. Please read it at your normal reading pace and press
        the &quot;Done&quot; button when you have finished. You can also
        manually set your reading speed.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <div className={clsx("flex-col")}>
        <Button
          onClick={(): void => actions.switchSegment("signup_wpm_manual")}
          size={"lg"}
          variant={"hollow"}
        >
          Set Manually
        </Button>
        <Spacer orientation={"vertical"} size={1.75} />
        <Button
          onClick={(): void => actions.switchSegment("signup_wpm_auto")}
          size={"lg"}
        >
          Start
        </Button>
      </div>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switchSegment("signup_wpm_base")}
          underline={"always"}
        >
          Return to the previous screen
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <Stepper active_steps={3} total_steps={3} />
    </>
  );
};

export default Page;
