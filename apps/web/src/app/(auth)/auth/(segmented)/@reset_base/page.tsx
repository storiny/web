"use client";

import React from "react";

import Link from "../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../packages/ui/src/components/typography";

import { use_auth_state } from "../../../actions";
import ResetForm from "./form";

const Page = (): React.ReactElement => {
  const { actions, state } = use_auth_state();
  const token = state.reset_password.token || "";

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Reset your password
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        Create a memorable and strong password.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <ResetForm token={token} />
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
