"use client";

import { DEFAULT_WPM } from "@storiny/shared";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Stepper from "~/components/stepper";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../state";
import { use_signup } from "../../../use-signup";

const Page = (): React.ReactElement => {
  const { set_state } = use_auth_state();
  const { handle_signup, is_loading } = use_signup();

  const on_skip = (): void => {
    set_state({
      signup: {
        wpm: DEFAULT_WPM
      }
    });

    handle_signup();
  };

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Just one more step...
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        As not all readers read at the same pace, the reading time for stories
        on Storiny depends on their reading speed. We can provide readers with
        more accurate and personalized reading times this way. You can always do
        this later.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <div className={css["flex-col"]}>
        <Button
          loading={is_loading}
          onClick={on_skip}
          size={"lg"}
          variant={"hollow"}
        >
          Skip
        </Button>
        <Spacer orientation={"vertical"} size={1.75} />
        <Button
          onClick={(): void =>
            set_state({ segment: "signup_wpm_confirmation" })
          }
          size={"lg"}
        >
          Take the Test
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
            set_state({ segment: "signup_username" });
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
