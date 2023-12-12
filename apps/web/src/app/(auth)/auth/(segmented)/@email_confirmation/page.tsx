"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_resend_verification_email_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../actions";

const Page = (): React.ReactElement => {
  const toast = use_toast();
  const { state } = use_auth_state();
  const email = state.signup.email || state.login_data?.email || "-";
  const [resend_verification_email, { isLoading: is_loading }] =
    use_resend_verification_email_mutation();

  const handle_resend_verification_email = (): void => {
    resend_verification_email({ email })
      .unwrap()
      .then(() => toast("Verification email sent", "success"))
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not send a verification email"
        )
      );
  };

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Almost there...
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        A confirmation e-mail has been sent to your e-mail address (
        <span className={css["t-medium"]} style={{ wordBreak: "break-all" }}>
          {email}
        </span>
        ). Please follow the instructions in the mail to verify your account.
        <br />
        <br />
        Did not receive an e-mail from us? Try checking the spam folder or{" "}
        <Link
          disabled={is_loading}
          href={"#"}
          onClick={(event): void => {
            event.preventDefault();

            if (!is_loading) {
              handle_resend_verification_email();
            }
          }}
          style={{ pointerEvents: is_loading ? "none" : "auto" }}
          underline={"always"}
        >
          request a new verification e-mail
        </Link>
        .
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
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
