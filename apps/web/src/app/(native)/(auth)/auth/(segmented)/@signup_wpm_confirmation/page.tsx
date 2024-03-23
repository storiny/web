"use client";

import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Stepper from "~/components/stepper";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../state";

const Page = (): React.ReactElement => {
  const { set_state } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Let&apos;s determine your reading speed
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography color={"minor"} level={"body2"}>
        After pressing the &quot;Start&quot; button, you will be presented with
        a piece of writing. Please read it at your normal reading pace and press
        the &quot;Done&quot; button when you have finished. You can also
        manually set your reading speed.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <div className={css["flex-col"]}>
        <Button
          onClick={(): void => set_state({ segment: "signup_wpm_manual" })}
          size={"lg"}
          variant={"hollow"}
        >
          Set Manually
        </Button>
        <Spacer orientation={"vertical"} size={1.75} />
        <Button
          onClick={(): void => set_state({ segment: "signup_wpm_auto" })}
          size={"lg"}
        >
          Start
        </Button>
      </div>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={css["flex-center"]}>
        <Link
          className={css["t-medium"]}
          href={"#"}
          level={"body2"}
          onClick={(event): void => {
            event.preventDefault();
            set_state({ segment: "signup_wpm_base" });
          }}
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
