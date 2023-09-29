import { clsx } from "clsx";
import React from "react";

import { useLoginRedirect } from "~/common/utils";
import Button from "../../../../../../../../packages/ui/src/components/button";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../packages/ui/src/components/typography";
import RetryIcon from "~/icons/Retry";
import SplashScreen from "../../../../../../../../packages/ui/src/layout/splash-screen";
import { fetch_user, select_auth_status, select_user } from "~/redux/features";
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
      <SplashScreen force_mount>
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
