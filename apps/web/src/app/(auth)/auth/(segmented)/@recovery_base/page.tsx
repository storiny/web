"use client";

import React from "react";

import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import { useAuthState } from "../../../actions";
import RecoveryForm from "./form";

const Page = (): React.ReactElement => {
  const { actions } = useAuthState();
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
          onClick={(): void => actions.switchSegment("login")}
          underline={"always"}
        >
          Log in instead
        </Link>
      </div>
    </>
  );
};

export default Page;
