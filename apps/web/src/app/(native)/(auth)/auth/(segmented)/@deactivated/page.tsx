"use client";

import React from "react";

import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_login_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_auth_state } from "../../../state";

const Page = (): React.ReactElement => {
  const { state } = use_auth_state();
  const router = use_app_router();
  const toast = use_toast();
  const [done, set_done] = React.useState<boolean>(false);
  const [reactivate_account, { isLoading: is_loading }] = use_login_mutation();

  const handle_reactivate = React.useCallback((): void => {
    if (state.login_data) {
      reactivate_account({
        ...state.login_data,
        code: state.mfa_code || undefined,
        bypass: true,
        blog_domain: null
      })
        .unwrap()
        .then((res) => {
          if (res.result === "success") {
            set_done(true);
            router.replace("/"); // Home page
            router.refresh(); // Refresh the state
          } else {
            set_done(false);
            toast("Could not reactivate your account", "error");
          }
        })
        .catch((error) => {
          set_done(false);
          handle_api_error(
            error,
            toast,
            null,
            "Could not reactivate your account"
          );
        });
    } else {
      toast("Could not reactivate your account", "error");
    }
  }, [reactivate_account, router, state.login_data, state.mfa_code, toast]);

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Glad to see you again!
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography color={"minor"} level={"body2"}>
        You have previously deactivated your account. Reactivate your account to
        start reading stories again.
      </Typography>
      <Grow />
      <div className={css["flex-center"]}>
        <Button
          className={css["full-w"]}
          disabled={done}
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
