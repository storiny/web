"use client";

import { clsx } from "clsx";
import React from "react";

import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import Typography from "~/components/typography";
import { logout_user } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

const Client = ({
  logout,
  to
}: {
  logout: () => Promise<void>;
  to: string;
}): React.ReactElement => {
  const router = use_app_router();
  const dispatch = use_app_dispatch();
  const [state, set_state] = React.useState<"loading" | "error">("loading");

  const try_logout = React.useCallback((): void => {
    set_state("loading");

    logout()
      .then(() => {
        dispatch(logout_user());
        router.replace(to);
        router.refresh(); // Refresh the state
      })
      .catch(() => set_state("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout, to]);

  React.useEffect(try_logout, [try_logout]);

  return state === "loading" ? (
    <div
      className={clsx(css["flex-col"], css["flex-center"])}
      style={{ margin: "auto" }}
    >
      <Spinner size={"lg"} />
    </div>
  ) : (
    <>
      <Typography as={"h1"} level={"h2"} style={{ textAlign: "center" }}>
        Unable to log you out
      </Typography>
      <Spacer className={css["f-grow"]} orientation={"vertical"} size={2} />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Button className={css["full-w"]} onClick={try_logout} size={"lg"}>
          Retry
        </Button>
      </div>
    </>
  );
};

export default Client;
