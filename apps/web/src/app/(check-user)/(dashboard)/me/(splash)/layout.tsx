import { clsx } from "clsx";
import React from "react";

import { useLoginRedirect } from "~/common/utils";
import Button from "~/components/Button";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import RetryIcon from "~/icons/Retry";
import SplashScreen from "~/layout/SplashScreen";
import { fetchUser, select_auth_status, select_user } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

// Handles client-side user authentication logic
const DashboardSplashLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement | null => {
  const redirect = useLoginRedirect();
  const [visible, setVisible] = React.useState<boolean>(true);
  const dispatch = use_app_dispatch();
  const authStatus = use_app_selector(select_auth_status);
  const user = use_app_selector(select_user);
  const loading = authStatus === "loading";

  React.useEffect(() => {
    setVisible(false);
  }, []);

  if (visible || loading || ["idle", "error"].includes(authStatus)) {
    return (
      <SplashScreen forceMount>
        {authStatus === "error" ? (
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
              checkAuth
              decorator={<RetryIcon />}
              loading={loading}
              onClick={(): void => {
                dispatch(fetchUser());
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
