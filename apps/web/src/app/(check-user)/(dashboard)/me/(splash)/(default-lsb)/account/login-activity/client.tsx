"use client";

import { clsx } from "clsx";
import React from "react";

import Accordion from "~/components/Accordion";
import Button from "~/components/Button";
import { useConfirmation } from "~/components/Confirmation";
import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import CustomState from "~/entities/CustomState";
import TitleBlock from "~/entities/TitleBlock";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import DevicesIcon from "~/icons/Devices";
import LogoutIcon from "~/icons/Logout";
import { useDestroySessionsMutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import DashboardGroup from "../../dashboard-group";
import DashboardTitle from "../../dashboard-title";
import DashboardWrapper from "../../dashboard-wrapper";
import LoginAccordion from "./login-accordion";
import { LoginActivityProps } from "./login-activity.props";
import LoginItem from "./login-item";
import AccountLoginActivityRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

// Recent login

const RecentLoginGroup = ({
  login
}: {
  login: LoginActivityProps["recent"];
}): React.ReactElement | null => {
  if (!login) {
    return null;
  }

  return (
    <React.Fragment>
      <DashboardGroup>
        <TitleBlock title={"Recent unrecognized login"}>
          Someone logged into your account from a new device. Please confirm
          whether it was you.
        </TitleBlock>
        <Spacer orientation={"vertical"} size={5} />
        <LoginItem login={login} ratio={2.85} />
      </DashboardGroup>
      <Divider />
    </React.Fragment>
  );
};

// Destroy sessions

const DestroySessions = ({
  onDestroy,
  disabled
}: {
  disabled: boolean;
  onDestroy: () => void;
}): React.ReactElement => {
  const toast = useToast();
  const [destroySessions, { isLoading }] = useDestroySessionsMutation();

  /**
   * Destroys all sessions except the current one
   */
  const destroySessionsImpl = (): void => {
    destroySessions()
      .unwrap()
      .then(onDestroy)
      .catch((e) =>
        toast(
          e?.data?.error || "Could not log you out of other devices",
          "error"
        )
      );
  };

  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <Button
        autoSize
        className={"fit-w"}
        color={"ruby"}
        disabled={disabled}
        loading={isLoading}
        onClick={openConfirmation}
        variant={"hollow"}
      >
        Log out of all other devices
      </Button>
    ),
    {
      onConfirm: destroySessionsImpl,
      title: "Log out of all devices?",
      decorator: <LogoutIcon />,
      color: "ruby",
      description:
        "You will be logged out of all devices except the current device."
    }
  );

  return (
    <React.Fragment>
      {element}
      {disabled && (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={1.5} />
          <Typography className={"t-minor"} level={"body3"}>
            You are not logged in to any other device.
          </Typography>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

const LoginActivityClient = (props: LoginActivityProps): React.ReactElement => {
  const { logins: loginsProp, recent: recentProp } = props;
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const [recent, setRecent] = React.useState<typeof recentProp>(recentProp);
  const [logins, setLogins] = React.useState<typeof loginsProp>(loginsProp);

  /**
   * Removes a login item
   */
  const removeLogin = React.useCallback((id: string) => {
    setLogins((prevState) => prevState.filter((item) => item.id !== id));
  }, []);

  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Login activity</DashboardTitle>
        <DashboardWrapper>
          {isSmallerThanDesktop && <RecentLoginGroup login={recent} />}
          <DashboardGroup>
            <TitleBlock title={"Devices"}>
              These are the devices on which you are currently logged in. If you
              see an entry that you do not recognize, log out of that device and
              change your account&apos;s password immediately.
            </TitleBlock>
            <Spacer orientation={"vertical"} size={4.75} />
            <Accordion
              className={clsx("flex-col", styles.x, styles.logins)}
              type={"multiple"}
            >
              {logins.length === 1 && !isSmallerThanDesktop ? (
                <CustomState
                  description={
                    "When you log in to your account from other devices, they will show up here."
                  }
                  icon={<DevicesIcon />}
                  title={"You're only logged in here"}
                />
              ) : (
                (recent || isSmallerThanDesktop
                  ? logins
                  : logins.filter((item) => !item.is_active)
                ).map((login) => (
                  <LoginAccordion
                    key={login.id}
                    login={login}
                    onLogout={(): void => removeLogin(login.id)}
                  />
                ))
              )}
            </Accordion>
          </DashboardGroup>
          <Divider />
          <DashboardGroup>
            <TitleBlock title={"Log out of other devices"}>
              You will remain logged in on the current device, but will be
              logged out from all other devices and will need to log in to them
              again.
            </TitleBlock>
            <Spacer orientation={"vertical"} size={4} />
            <DestroySessions
              disabled={!recent && logins.length === 1}
              onDestroy={(): void => {
                setRecent(undefined);
                setLogins((prevState) =>
                  prevState.filter((item) => item.is_active)
                );
              }}
            />
          </DashboardGroup>
        </DashboardWrapper>
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <AccountLoginActivityRightSidebar>
        <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
          {recent ? "Recent unrecognized login" : "Current device"}
        </Typography>
        <LoginItem login={recent || logins.find((login) => login.is_active)!} />
      </AccountLoginActivityRightSidebar>
    </React.Fragment>
  );
};

export default LoginActivityClient;
