"use client";

import React from "react";

import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";
import RecoveryForm from "./form";

const Page = (): React.ReactElement => {
  const { actions } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Recover your account
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        In order to send you a confirmation e-mail, we require the e-mail
        address associated with your account.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <RecoveryForm />
      <Spacer orientation={"vertical"} size={5} />
      <div className={css["flex-center"]}>
        <Link
          className={css["t-medium"]}
          href={"#"}
          level={"body2"}
          onClick={(event): void => {
            event.preventDefault();
            actions.switch_segment("login");
          }}
          underline={"always"}
        >
          Log in instead
        </Link>
      </div>
    </>
  );
};

export default Page;
