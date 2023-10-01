"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";

const Page = (): React.ReactElement => {
  const { actions, state } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Almost there...
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        A confirmation e-mail has been sent to your e-mail address (
        <span className={css["t-medium"]} style={{ wordBreak: "break-all" }}>
          {state.signup.email}
        </span>
        ). Please follow the instructions in the mail to finish creating your
        account.
        <br />
        <br />
        Did not receive an e-mail from us? Try checking the spam folder or{" "}
        <Link href={"/auth"} underline={"always"}>
          request a new verification e-mail
        </Link>
        .
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        {Boolean(state.signup.email) && (
          <>
            <Link
              className={css["t-medium"]}
              href={"/auth"}
              level={"body2"}
              onClick={(): void => actions.switch_segment("signup_base")}
              underline={"always"}
            >
              Edit your e-mail address
            </Link>
            <Spacer orientation={"vertical"} size={3} />
          </>
        )}
        <Button
          as={NextLink}
          className={css["full-w"]}
          href={"/"}
          size={"lg"}
          variant={"hollow"}
        >
          Home
        </Button>
      </div>
    </>
  );
};

export default Page;
