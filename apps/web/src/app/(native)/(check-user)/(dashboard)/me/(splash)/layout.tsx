"use client";

import { clsx } from "clsx";
import React from "react";

import { use_login_redirect } from "~/common/utils";
import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import RetryIcon from "~/icons/retry";
import SplashScreen from "~/layout/splash-screen";
import { fetch_user, select_auth_status, select_user } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

// Handles client-side user authentication logic
const DashboardSplashLayout = ({
  children,
  hide_logo
}: {
  children: React.ReactNode;
  hide_logo?: boolean;
}): React.ReactElement | null => {
  const redirect = use_login_redirect();
  const [visible, set_visible] = React.useState<boolean>(true);
  const dispatch = use_app_dispatch();
  const auth_status = use_app_selector(select_auth_status);
  const user = use_app_selector(select_user);
  const loading = ["idle", "loading"].includes(auth_status);

  React.useEffect(() => {
    set_visible(false);
  }, []);

  if (visible || loading || auth_status === "error") {
    return (
      <SplashScreen force_mount hide_logo={hide_logo}>
        {auth_status === "error" ? (
          <React.Fragment>
            <Typography
              className={clsx(css["t-minor"], css["t-center"])}
              level={"body2"}
              style={{ maxWidth: "320px" }}
            >
              We are facing some issues getting your account data from the
              server at the moment.
            </Typography>
            <Spacer orientation={"vertical"} size={2} />
            <Button
              check_auth
              decorator={<RetryIcon />}
              loading={loading}
              onClick={(): void => {
                dispatch(fetch_user());
              }}
              size={"sm"}
            >
              Retry
            </Button>
          </React.Fragment>
        ) : null}
      </SplashScreen>
    );
  }

  if (!user) {
    redirect();
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default DashboardSplashLayout;
