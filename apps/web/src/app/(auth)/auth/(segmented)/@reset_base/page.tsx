"use client";

import { useSearchParams as use_search_params } from "next/navigation";
import React from "react";

import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../state";
import ResetForm from "./form";

const Page = (): React.ReactElement => {
  const params = use_search_params();
  const { set_state } = use_auth_state();
  const token = params.get("token") || "";

  React.useEffect(() => {
    set_state({ reset_password: { token } });
  }, [set_state, token]);

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Reset your password
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        Create a memorable and strong password.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <ResetForm token={token} />
      <Spacer orientation={"vertical"} size={5} />
      <div className={css["flex-center"]}>
        <Link
          className={css["t-medium"]}
          href={"#"}
          level={"body2"}
          onClick={(event): void => {
            event.preventDefault();
            set_state({ segment: "login" });
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
