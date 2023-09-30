"use client";

import React from "react";

import Link from "../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../packages/ui/src/components/typography";

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
      <Typography className={"t-minor"} level={"body2"}>
        In order to send you a confirmation e-mail, we require the e-mail
        address associated with your account.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <RecoveryForm />
      <Spacer orientation={"vertical"} size={5} />
      <div className={"flex-center"}>
        <Link
          className={"t-medium"}
          href={"/auth"}
          level={"body2"}
          onClick={(): void => actions.switch_segment("login")}
          underline={"always"}
        >
          Log in instead
        </Link>
      </div>
    </>
  );
};

export default Page;
