"use client";

import { clsx } from "clsx";
import React from "react";

import Accordion from "~/components/Accordion";
import Spacer from "~/components/Spacer";
import TitleBlock from "~/entities/TitleBlock";

import DashboardGroup from "../../dashboard-group";
import DashboardTitle from "../../dashboard-title";
import DashboardWrapper from "../../dashboard-wrapper";
import { LoginActivityProps } from "./login-activity.props";
import LoginItem from "./login-item";
import AccountLoginActivityRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const LoginActivityClient = (props: LoginActivityProps): React.ReactElement => {
  const { logins } = props;
  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Login activity</DashboardTitle>
        <DashboardWrapper>
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
              {logins.map((login) => (
                <LoginItem key={login.id} login={login} />
              ))}
            </Accordion>
          </DashboardGroup>
        </DashboardWrapper>
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <AccountLoginActivityRightSidebar />
    </React.Fragment>
  );
};

export default LoginActivityClient;
