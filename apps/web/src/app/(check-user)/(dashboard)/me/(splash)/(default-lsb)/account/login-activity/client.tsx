"use client";

import { clsx } from "clsx";
import React from "react";

import Accordion from "~/components/accordion";
import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import CustomState from "~/entities/custom-state";
import TitleBlock from "~/entities/title-block";
import { use_media_query } from "~/hooks/use-media-query";
import DevicesIcon from "~/icons/devices";
import LogoutIcon from "~/icons/logout";
import { use_destroy_sessions_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

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
  on_destroy,
  disabled
}: {
  disabled: boolean;
  on_destroy: () => void;
}): React.ReactElement => {
  const toast = use_toast();
  const [destroy_sessions, { isLoading: is_loading }] =
    use_destroy_sessions_mutation();

  /**
   * Destroys all the sessions
   */
  const destroy_sessions_impl = (): void => {
    destroy_sessions()
      .unwrap()
      .then(on_destroy)
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not log you out of devices")
      );
  };

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        color={"ruby"}
        disabled={disabled}
        loading={is_loading}
        onClick={open_confirmation}
        variant={"hollow"}
      >
        Log out of all devices
      </Button>
    ),
    {
      on_confirm: destroy_sessions_impl,
      title: "Log out of all devices?",
      decorator: <LogoutIcon />,
      color: "ruby",
      description:
        "You will be logged out of all the devices, including the current device."
    }
  );

  return (
    <React.Fragment>
      {element}
      {disabled && (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={1.5} />
          <Typography className={css["t-minor"]} level={"body3"}>
            You are not logged in to any other device.
          </Typography>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

const LoginActivityClient = (props: LoginActivityProps): React.ReactElement => {
  const { logins: logins_prop, recent: recent_prop } = props;
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const [recent, set_recent] = React.useState<typeof recent_prop>(recent_prop);
  const [logins, set_logins] = React.useState<typeof logins_prop>(logins_prop);

  /**
   * Removes a login item
   */
  const remove_login = React.useCallback((id: string) => {
    set_logins((prev_state) => prev_state.filter((item) => item.id !== id));
  }, []);

  return (
    <React.Fragment>
      <main data-root={"true"}>
        <DashboardTitle>Login activity</DashboardTitle>
        <DashboardWrapper>
          {is_smaller_than_desktop && <RecentLoginGroup login={recent} />}
          <DashboardGroup>
            <TitleBlock title={"Devices"}>
              These are the devices on which you are currently logged in. If you
              see an entry that you do not recognize, log out of that device and
              change your account&apos;s password immediately.
            </TitleBlock>
            <Spacer orientation={"vertical"} size={4.75} />
            <Accordion
              className={clsx(css["flex-col"], styles.x, styles.logins)}
              type={"multiple"}
            >
              {logins.length === 1 && !is_smaller_than_desktop ? (
                <CustomState
                  description={
                    "When you log in to your account from other devices, they will show up here."
                  }
                  icon={<DevicesIcon />}
                  title={"You're only logged in here"}
                />
              ) : (
                (recent || is_smaller_than_desktop
                  ? logins
                  : logins.filter((item) => !item.is_active)
                ).map((login) => (
                  <LoginAccordion
                    key={login.id}
                    login={login}
                    on_logout={(): void => remove_login(login.id)}
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
              on_destroy={(): void => {
                set_recent(undefined);
                set_logins((prev_state) =>
                  prev_state.filter((item) => item.is_active)
                );
              }}
            />
          </DashboardGroup>
        </DashboardWrapper>
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <AccountLoginActivityRightSidebar>
        <Typography
          className={clsx(css["t-minor"], css["t-medium"])}
          level={"body2"}
        >
          {recent ? "Recent unrecognized login" : "Current device"}
        </Typography>
        <LoginItem login={recent || logins.find((login) => login.is_active)!} />
      </AccountLoginActivityRightSidebar>
    </React.Fragment>
  );
};

export default LoginActivityClient;
