"use client";

import React from "react";

import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Stepper from "~/components/stepper";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";
import SignupWPMForm from "./form";

const Page = (): React.ReactElement => {
  const { actions } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Set your reading speed
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        The speed at which you read is measured in words per minute. Unless you
        are a superhuman, it usually falls between 70 and 320 words per minute.
        Should you find your reading pace to be too fast or too slow, please{" "}
        <Link href={"/support"} underline={"always"}>
          contact support
        </Link>
        .
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <SignupWPMForm />
      <Spacer orientation={"vertical"} size={5} />
      <div className={css["flex-center"]}>
        <Link
          className={css["t-medium"]}
          href={"/auth"}
          level={"body2"}
          onClick={(): void =>
            actions.switch_segment("signup_wpm_confirmation")
          }
          underline={"always"}
        >
          Return to the previous screen
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <Stepper active_steps={2} total_steps={3} />
    </>
  );
};

export default Page;
