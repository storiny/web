import { clsx } from "clsx";
import React from "react";

import { use_login_redirect } from "~/common/utils";
import { fetch_user, select_auth_status, select_user } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import RetryIcon from "~/icons/retry";
import SplashScreen from "~/layout/splash-screen";

// Handles client-side user authentication logic
const DashboardSplashLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement | null => {
  const redirect = use_login_redirect();
  const [visible, set_visible] = React.useState<boolean>(true);
  const dispatch = use_app_dispatch();
  const auth_status = use_app_selector(select_auth_status);
  const user = use_app_selector(select_user);
  const loading = auth_status === "loading";

  React.useEffect(() => {
    set_visible(false);
  }, []);

  if (visible || loading || ["idle", "error"].includes(auth_status)) {
    return (
      <SplashScreen force_mount>
        {auth_status === "error" ? (
          <React.Fragment>
            <Typography
              className={clsx("t-minor", "t-center")}
              level={"body3"}
              style={{ maxWidth: "320px" }}
            >
              We are currently experiencing difficulties retrieving your account
              data from the server
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
