"use client";

import { useRouter as use_router } from "next/navigation";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_login_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../actions";

const Page = (): React.ReactElement => {
  const { state } = use_auth_state();
  const router = use_router();
  const toast = use_toast();
  const [reactivate_account, { isLoading: is_loading }] = use_login_mutation();

  const handle_reactivate = React.useCallback((): void => {
    if (state.login_data) {
      reactivate_account({ ...state.login_data, bypass: true })
        .unwrap()
        .then((res) => {
          if (res.result === "success") {
            router.replace("/"); // Home page
          } else {
            toast("Could not reactivate your account", "error");
          }
        })
        .catch((error) =>
          handle_api_error(
            error,
            toast,
            null,
            "Could not reactivate your account"
          )
        );
    } else {
      toast("Could not reactivate your account", "error");
    }
  }, [reactivate_account, router, state.login_data, toast]);

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Glad to see you again!
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        You have previously deactivated your account. Reactivate your account to
        start reading stories again.
      </Typography>
      <Grow />
      <div className={css["flex-center"]}>
        <Button
          className={css["full-w"]}
          loading={is_loading}
          onClick={handle_reactivate}
          size={"lg"}
        >
          Reactivate account
        </Button>
      </div>
    </>
  );
};

export default Page;
